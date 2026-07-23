import { PrismaClient } from '@prisma/client';
const db=new PrismaClient();const base='http://127.0.0.1:3210';
const p=await db.product.findFirst({where:{listings:{some:{}}},include:{skus:{include:{externalCodes:true}},listings:true}});if(!p)throw new Error('No seeded product');
const frozenCode=p.skus[0].internalCode;const platformId=p.listings[0].productExternalId;
const body={name:p.name,brand:p.brand,category:p.category,note:p.note,cainiaoCode:p.cainiaoCode,status:p.status,
 skus:[...p.skus.map((s,i)=>({id:s.id,spec:s.spec,barcode:s.externalCodes.find(x=>x.type==='BARCODE')?.value||'',cainiao:s.externalCodes.find(x=>x.type==='CAINIAO')?.value||'',status:i===0?'INACTIVE':s.status})),{spec:'冒烟测试新增规格',barcode:'TEST-BARCODE-NEW',cainiao:'TEST-CAINIAO-NEW',status:'ACTIVE'}],
 listings:p.listings.map(l=>({id:l.id,channel:l.channel,shop:l.shop||'',productExternalId:l.productExternalId,status:l.status}))};
const update=await fetch(`${base}/api/products/${p.id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const updateBody=await update.json();if(!update.ok)throw new Error(JSON.stringify(updateBody));
const stopped=await (await fetch(`${base}/api/scan?q=${frozenCode}`)).json();const platform=await (await fetch(`${base}/api/scan?q=${platformId}`)).json();const after=await db.product.findUnique({where:{id:p.id},include:{skus:true,changes:true}});const created=after.skus.find(s=>s.spec==='冒烟测试新增规格');
const result={update:update.status,createdCode:created?.internalCode,frozenCodeStillSame:after.skus.some(s=>s.internalCode===frozenCode),stoppedScanStatus:stopped.sku?.status,platformScanKind:platform.kind,historyEntries:after.changes.length};console.log(JSON.stringify(result));
if(!created||!result.frozenCodeStillSame||result.stoppedScanStatus!=='INACTIVE'||result.platformScanKind!=='product')process.exitCode=1;await db.$disconnect();
