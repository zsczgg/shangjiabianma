import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { allocateInternalCode } from '@/lib/catalog';
import { z } from 'zod';

const status=z.enum(['ACTIVE','INACTIVE']);
const updateSchema=z.object({
  name:z.string().min(1),brand:z.string().nullable(),category:z.string().nullable(),note:z.string().nullable(),cainiaoCode:z.string().nullable(),status,
  skus:z.array(z.object({id:z.string().optional(),spec:z.string().min(1),barcode:z.string(),cainiao:z.string(),status})).min(1),
  listings:z.array(z.object({id:z.string().optional(),channel:z.enum(['淘宝','闲鱼','小红书','其他']),shop:z.string(),productExternalId:z.string().min(1),status}))
}).strict();
const labels:Record<string,string>={name:'商品名称',brand:'品牌',category:'分类',note:'备注',cainiaoCode:'商品级菜鸟云仓编码',status:'状态',spec:'规格名称',barcode:'厂家条码',cainiao:'菜鸟货品编码'};
const val=(v:string|null|undefined)=>v||null;

export async function PUT(req:Request,{params}:{params:{id:string}}){try{
  const data=updateSchema.parse(await req.json());
  const current=await prisma.product.findUnique({where:{id:params.id},include:{skus:{include:{externalCodes:true}},listings:true}});
  if(!current)return NextResponse.json({error:'商品不存在'},{status:404});
  const productCode=data.cainiaoCode?.trim()||null;const skuCodes=data.skus.map(s=>s.cainiao.trim()).filter(Boolean);if(productCode&&skuCodes.includes(productCode))throw new Error('商品级菜鸟编码不能与规格菜鸟编码相同');if(productCode){const ext=await prisma.externalCode.findUnique({where:{value:productCode}});if(ext)throw new Error('该菜鸟编码已被规格使用');}for(const code of skuCodes){const owner=await prisma.product.findUnique({where:{cainiaoCode:code}});if(owner&&owner.id!==current.id)throw new Error('该菜鸟编码已被其他商品使用');}
  const createdCodes:string[]=[];
  await prisma.$transaction(async tx=>{
    const changes:{productId:string;skuId?:string;field:string;oldValue:string|null;newValue:string|null}[]=[];
    for(const field of ['name','brand','category','note','cainiaoCode','status'] as const)if(val(current[field])!==val(data[field]))changes.push({productId:current.id,field:labels[field],oldValue:val(current[field]),newValue:val(data[field])});
    await tx.product.update({where:{id:current.id},data:{name:data.name,brand:data.brand,category:data.category,note:data.note,cainiaoCode:productCode,status:data.status}});
    for(const incoming of data.skus){
      if(!incoming.id){
        const internalCode=await allocateInternalCode(tx);
        const made=await tx.sku.create({data:{productId:current.id,internalCode,spec:incoming.spec,status:'ACTIVE',externalCodes:{create:[...(incoming.barcode?[{type:'BARCODE',value:incoming.barcode,label:'厂家条码'}]:[]),...(incoming.cainiao?[{type:'CAINIAO',value:incoming.cainiao,label:'菜鸟货品编码'}]:[])]}}});
        changes.push({productId:current.id,skuId:made.id,field:'新增规格',oldValue:null,newValue:`${incoming.spec} · ${internalCode}`});createdCodes.push(internalCode);continue;
      }
      const old=current.skus.find(s=>s.id===incoming.id);if(!old)throw new Error('规格不属于当前商品');
      for(const field of ['spec','status'] as const)if(old[field]!==incoming[field])changes.push({productId:current.id,skuId:old.id,field:labels[field],oldValue:old[field],newValue:incoming[field]});
      await tx.sku.update({where:{id:old.id},data:{spec:incoming.spec,status:incoming.status}});
      for(const kind of [{type:'BARCODE',key:'barcode' as const},{type:'CAINIAO',key:'cainiao' as const}]){const previous=old.externalCodes.find(e=>e.type===kind.type)?.value||'';const next=incoming[kind.key].trim();if(previous!==next){changes.push({productId:current.id,skuId:old.id,field:labels[kind.key],oldValue:val(previous),newValue:val(next)});await tx.externalCode.deleteMany({where:{skuId:old.id,type:kind.type}});if(next)await tx.externalCode.create({data:{skuId:old.id,type:kind.type,value:next,label:labels[kind.key]}});}}
    }
    for(const incoming of data.listings){
      if(incoming.id){const old=current.listings.find(x=>x.id===incoming.id);if(!old)throw new Error('平台关系不属于当前商品');await tx.channelListing.update({where:{id:old.id},data:{channel:incoming.channel,shop:val(incoming.shop),productExternalId:incoming.productExternalId,status:incoming.status}});const before=`${old.channel}/${old.shop||''}/${old.productExternalId}/${old.status}`;const after=`${incoming.channel}/${incoming.shop}/${incoming.productExternalId}/${incoming.status}`;if(before!==after)changes.push({productId:current.id,field:'平台商品关系',oldValue:before,newValue:after});}
      else{await tx.channelListing.create({data:{productId:current.id,channel:incoming.channel,shop:val(incoming.shop),productExternalId:incoming.productExternalId,status:'ACTIVE'}});changes.push({productId:current.id,field:'新增平台关系',oldValue:null,newValue:`${incoming.channel}/${incoming.shop}/${incoming.productExternalId}`});}
    }
    if(changes.length)await tx.changeLog.createMany({data:changes});
  });
  return NextResponse.json({ok:true,createdCodes});
}catch(e){const message=e instanceof Error?e.message:'保存失败';return NextResponse.json({error:message.includes('Unique constraint')?'该编码或平台关系已被其他商品使用':message},{status:400});}}
