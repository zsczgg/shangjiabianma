'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  IconAdjustmentsHorizontal,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconMinus,
  IconPhoto,
  IconPlus,
  IconPrinter,
  IconRefresh,
  IconSearch,
} from '@tabler/icons-react';
import LabelBarcode from '@/components/label-barcode';
import {
  codeByType,
  expandPrintableItems,
  labelMatchesQuery,
  totalLabelCopies,
  type LabelItem,
  type QueueQuantities,
} from '@/lib/labels';
import {
  DEFAULT_LABEL_SETTINGS,
  type LabelFieldSettings,
  type LabelPaperSize,
  type LabelSettings,
} from '@/lib/label-settings';

const fieldLabels: Array<[keyof LabelFieldSettings, string]> = [
  ['brandName', '品牌标识'],
  ['productName', '商品名称'],
  ['spec', '规格'],
  ['internalCodeText', '内部编码文字'],
  ['barcodeText', '条码下方编码'],
  ['manufacturer', '厂家条码'],
  ['cainiao', '仓配编码'],
  ['platforms', '平台 ID'],
  ['image', '商品图片'],
  ['note', '备注内容'],
];

const paperDimensions: Record<LabelPaperSize, { width: number; height: number; label: string }> = {
  '40x30': { width: 40, height: 30, label: '40 × 30 mm' },
  '70x50': { width: 70, height: 50, label: '70 × 50 mm' },
  '100x100': { width: 100, height: 100, label: '100 × 100 mm' },
};

function clampQuantity(value: number) {
  return Math.min(999, Math.max(0, Math.floor(Number.isFinite(value) ? value : 0)));
}

function QuantityControl({
  value,
  onChange,
  compact = false,
}: {
  value: number;
  onChange: (value: number) => void;
  compact?: boolean;
}) {
  return (
    <div className={compact ? 'quantity-control compact' : 'quantity-control'}>
      <button type="button" aria-label="减少一张" onClick={() => onChange(clampQuantity(value - 1))}><IconMinus /></button>
      <input
        aria-label="打印份数"
        inputMode="numeric"
        min="0"
        max="999"
        type="number"
        value={value}
        onChange={event => onChange(clampQuantity(Number(event.target.value)))}
      />
      <button type="button" aria-label="增加一张" onClick={() => onChange(clampQuantity(value + 1))}><IconPlus /></button>
    </div>
  );
}

function ExternalBarcode({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="label-external-code">
      <span>{label}</span>
      <LabelBarcode value={value} compact />
    </div>
  );
}

function ProductLabel({
  item,
  paper,
  fields,
  brandText,
  customNote,
  calibration,
  print = false,
}: {
  item: LabelItem;
  paper: LabelPaperSize;
  fields: LabelFieldSettings;
  brandText: string;
  customNote: string;
  calibration: { x: number; y: number };
  print?: boolean;
}) {
  const manufacturer = codeByType(item, 'BARCODE');
  const skuCainiao = codeByType(item, 'CAINIAO');
  const cainiao = skuCainiao || item.productCainiaoCode;
  const note = customNote.trim() || item.note;

  return (
    <article
      className={`physical-label label-${paper}${print ? ' print-label' : ''}`}
      style={print ? { transform: `translate(${calibration.x}mm, ${calibration.y}mm)` } : undefined}
    >
      {fields.brandName && <><div className="label-brand">{brandText}</div><div className="label-rule" /></>}
      <div className="label-product-row">
        <div className="label-product-copy">
          {fields.productName && <><span className="label-caption">商品名称</span><strong>{item.productName}</strong></>}
          {fields.spec && <><span className="label-caption">规格</span><b>{item.spec}</b></>}
        </div>
        {fields.image && item.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="label-product-image" src={item.imageUrl} alt="" />
        )}
      </div>
      <div className="label-primary-code">
        {fields.internalCodeText && <><span className="label-caption">内部编码</span><strong>{item.internalCode}</strong></>}
        <LabelBarcode value={item.internalCode} showText={fields.barcodeText} />
      </div>
      {(fields.manufacturer && manufacturer || fields.cainiao && cainiao || fields.platforms && item.platformCodes.length > 0) && (
        <div className="label-secondary-codes">
          {fields.manufacturer && <ExternalBarcode label="厂家条码" value={manufacturer} />}
          {fields.cainiao && <ExternalBarcode label="仓配编码" value={cainiao} />}
          {fields.platforms && item.platformCodes.map(code => (
            <ExternalBarcode
              key={`${code.channel}-${code.shop || ''}-${code.value}`}
              label={`${code.channel}${code.shop ? ` · ${code.shop}` : ''}`}
              value={code.value}
            />
          ))}
        </div>
      )}
      {fields.note && note && <div className="label-note">备注：{note}</div>}
    </article>
  );
}

export default function LabelPrintCenter({ items, initialSkuId }: { items: LabelItem[]; initialSkuId?: string }) {
  const initialItem = items.find(item => item.skuId === initialSkuId) || items[0];
  const [query, setQuery] = useState('');
  const [paper, setPaper] = useState<LabelPaperSize>(DEFAULT_LABEL_SETTINGS.paper);
  const [defaultCopies, setDefaultCopies] = useState(DEFAULT_LABEL_SETTINGS.defaultCopies);
  const [quantities, setQuantities] = useState<QueueQuantities>(() => initialItem ? { [initialItem.skuId]: 1 } : {});
  const [activeSkuId, setActiveSkuId] = useState(initialItem?.skuId || '');
  const [fields, setFields] = useState<LabelFieldSettings>(DEFAULT_LABEL_SETTINGS.fields);
  const [brandText, setBrandText] = useState(DEFAULT_LABEL_SETTINGS.brandText);
  const [customNote, setCustomNote] = useState(DEFAULT_LABEL_SETTINGS.customNote);
  const [calibration, setCalibration] = useState(DEFAULT_LABEL_SETTINGS.calibration);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'loading' | 'saving' | 'saved' | 'error'>('loading');

  useEffect(() => {
    async function loadSettings() {
      let next = DEFAULT_LABEL_SETTINGS;
      try {
        const response = await fetch('/api/label-settings', { cache: 'no-store' });
        if (!response.ok) throw new Error('读取设置失败');
        const data = await response.json() as { settings: LabelSettings; exists: boolean };
        next = data.settings;
        if (!data.exists) {
          const local = localStorage.getItem('yyhxfz-label-preferences');
          if (local) {
            const parsed = JSON.parse(local) as Partial<LabelSettings>;
            next = {
              ...DEFAULT_LABEL_SETTINGS,
              ...parsed,
              fields: { ...DEFAULT_LABEL_SETTINGS.fields, ...parsed.fields },
              calibration: { ...DEFAULT_LABEL_SETTINGS.calibration, ...parsed.calibration },
            };
          }
        }
      } catch {
        const local = localStorage.getItem('yyhxfz-label-preferences');
        if (local) {
          try {
            const parsed = JSON.parse(local) as Partial<LabelSettings>;
            next = {
              ...DEFAULT_LABEL_SETTINGS,
              ...parsed,
              fields: { ...DEFAULT_LABEL_SETTINGS.fields, ...parsed.fields },
              calibration: { ...DEFAULT_LABEL_SETTINGS.calibration, ...parsed.calibration },
            };
          } catch {
            next = DEFAULT_LABEL_SETTINGS;
          }
        }
      } finally {
        setPaper(next.paper);
        setDefaultCopies(next.defaultCopies);
        setBrandText(next.brandText);
        setCustomNote(next.customNote);
        setFields(next.fields);
        setCalibration(next.calibration);
        setPreferencesLoaded(true);
        setSaveStatus('saved');
      }
    }
    void loadSettings();
  }, []);

  useEffect(() => {
    if (!preferencesLoaded) return;
    setSaveStatus('saving');
    const settings: LabelSettings = { paper, defaultCopies, brandText, customNote, fields, calibration };
    const timer = window.setTimeout(async () => {
      localStorage.setItem('yyhxfz-label-preferences', JSON.stringify(settings));
      try {
        const response = await fetch('/api/label-settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settings),
        });
        if (!response.ok) throw new Error('保存失败');
        setSaveStatus('saved');
      } catch {
        setSaveStatus('error');
      }
    }, 450);
    return () => window.clearTimeout(timer);
  }, [brandText, calibration, customNote, defaultCopies, fields, paper, preferencesLoaded]);

  const filteredItems = useMemo(() => items.filter(item => labelMatchesQuery(item, query)), [items, query]);
  const queuedItems = useMemo(() => items.filter(item => (quantities[item.skuId] ?? 0) > 0), [items, quantities]);
  const activeItem = items.find(item => item.skuId === activeSkuId) || queuedItems[0] || filteredItems[0];
  const activeIndex = activeItem ? queuedItems.findIndex(item => item.skuId === activeItem.skuId) : -1;
  const totalCopies = totalLabelCopies(quantities);
  const printableItems = useMemo(() => expandPrintableItems(items, quantities), [items, quantities]);

  function setQuantity(skuId: string, quantity: number) {
    const nextQuantity = clampQuantity(quantity);
    setQuantities(current => {
      const next = { ...current };
      if (nextQuantity === 0) delete next[skuId];
      else next[skuId] = nextQuantity;
      return next;
    });
    if (nextQuantity > 0) setActiveSkuId(skuId);
  }

  function addVisibleItems() {
    setQuantities(current => {
      const next = { ...current };
      for (const item of filteredItems) next[item.skuId] = next[item.skuId] || defaultCopies;
      return next;
    });
    if (filteredItems[0]) setActiveSkuId(filteredItems[0].skuId);
  }

  function resetPreferences() {
    setPaper(DEFAULT_LABEL_SETTINGS.paper);
    setDefaultCopies(DEFAULT_LABEL_SETTINGS.defaultCopies);
    setBrandText(DEFAULT_LABEL_SETTINGS.brandText);
    setFields(DEFAULT_LABEL_SETTINGS.fields);
    setCalibration(DEFAULT_LABEL_SETTINGS.calibration);
    setCustomNote(DEFAULT_LABEL_SETTINGS.customNote);
  }

  function printLabels() {
    if (!totalCopies) return;
    const existing = document.getElementById('dynamic-label-page');
    existing?.remove();
    const style = document.createElement('style');
    style.id = 'dynamic-label-page';
    const dimensions = paperDimensions[paper];
    style.textContent = `@page { size: ${dimensions.width}mm ${dimensions.height}mm; margin: 0; }`;
    document.head.appendChild(style);
    document.documentElement.dataset.labelPrinting = 'true';
    const cleanup = () => {
      delete document.documentElement.dataset.labelPrinting;
      style.remove();
    };
    window.addEventListener('afterprint', cleanup, { once: true });
    requestAnimationFrame(() => window.print());
  }

  if (!items.length) {
    return (
      <div className="page">
        <span className="eyebrow">LABEL PRINTING</span>
        <h1>标签打印中心</h1>
        <div className="card label-empty">
          <IconPrinter />
          <h2>还没有可打印的规格</h2>
          <p>新建并启用商品规格后，就可以在这里制作标签。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="label-center">
      <div className="label-center-title">
        <div>
          <span className="eyebrow">LABEL PRINTING</span>
          <h1>标签打印中心</h1>
          <p>批量生成并打印商品标签，支持多规格商品</p>
        </div>
      </div>

      <div className="label-command-bar">
        <div className="command-group">
          <span>标签规格</span>
          <div className="segmented">
            <button type="button" className={paper === '40x30' ? 'active' : ''} onClick={() => setPaper('40x30')}>40 × 30 mm</button>
            <button type="button" className={paper === '70x50' ? 'active' : ''} onClick={() => setPaper('70x50')}>70 × 50 mm</button>
            <button type="button" className={paper === '100x100' ? 'active' : ''} onClick={() => setPaper('100x100')}>100 × 100 mm</button>
          </div>
        </div>
        <div className="command-group">
          <span>加入队列时份数</span>
          <QuantityControl value={defaultCopies} onChange={value => setDefaultCopies(Math.max(1, value))} compact />
        </div>
        <button className="quiet-button" type="button" onClick={resetPreferences}><IconRefresh /> 恢复默认</button>
        <div className="calibration-summary"><IconAdjustmentsHorizontal /> 偏移 X {calibration.x.toFixed(1)} / Y {calibration.y.toFixed(1)} mm</div>
        <button className="primary label-print-button" type="button" onClick={printLabels} disabled={!totalCopies}>
          <IconPrinter /> 打印标签 <span>{totalCopies}</span>
        </button>
      </div>

      <div className="label-workspace">
        <aside className="label-queue-panel">
          <div className="panel-heading">
            <div><b>批量打印队列</b><span>已选 {queuedItems.length} 个规格</span></div>
            {totalCopies > 0 && <button type="button" onClick={() => setQuantities({})}>清空</button>}
          </div>
          <label className="label-search">
            <IconSearch />
            <input value={query} onChange={event => setQuery(event.target.value)} placeholder="搜索商品、规格或编码" />
          </label>
          <div className="queue-tools">
            <span>找到 {filteredItems.length} 个规格</span>
            <button type="button" onClick={addVisibleItems}>全部加入</button>
          </div>
          <div className="label-item-list">
            {filteredItems.map(item => {
              const quantity = quantities[item.skuId] ?? 0;
              const selected = item.skuId === activeItem?.skuId;
              return (
                <div
                  className={`label-item-row${selected ? ' selected' : ''}`}
                  key={item.skuId}
                  onClick={() => setActiveSkuId(item.skuId)}
                >
                  <button
                    type="button"
                    className={`queue-check${quantity > 0 ? ' checked' : ''}`}
                    aria-label={quantity > 0 ? '从打印队列移除' : '加入打印队列'}
                    onClick={event => {
                      event.stopPropagation();
                      setQuantity(item.skuId, quantity > 0 ? 0 : defaultCopies);
                    }}
                  >
                    {quantity > 0 && <IconCheck />}
                  </button>
                  <div className="label-item-copy">
                    <b>{item.productName}</b>
                    <span>{item.spec}</span>
                    <code>{item.internalCode}</code>
                  </div>
                  {quantity > 0 && <QuantityControl compact value={quantity} onChange={value => setQuantity(item.skuId, value)} />}
                </div>
              );
            })}
          </div>
        </aside>

        <section className="label-preview-panel">
          <div className="panel-heading preview-heading">
            <div><b>标签预览</b><span>{paperDimensions[paper].label} · 按真实比例</span></div>
            {queuedItems.length > 1 && (
              <div className="preview-pagination">
                <button
                  type="button"
                  aria-label="上一个标签"
                  disabled={activeIndex <= 0}
                  onClick={() => setActiveSkuId(queuedItems[activeIndex - 1].skuId)}
                ><IconChevronLeft /></button>
                <span>{Math.max(activeIndex + 1, 1)} / {queuedItems.length}</span>
                <button
                  type="button"
                  aria-label="下一个标签"
                  disabled={activeIndex < 0 || activeIndex >= queuedItems.length - 1}
                  onClick={() => setActiveSkuId(queuedItems[activeIndex + 1].skuId)}
                ><IconChevronRight /></button>
              </div>
            )}
          </div>
          <div className={`label-stage stage-${paper}`}>
            <div className="ruler ruler-horizontal"><span>0</span><span>{paperDimensions[paper].width / 2}</span><span>{paperDimensions[paper].width} mm</span></div>
            <div className="ruler ruler-vertical"><span>0</span><span>{paperDimensions[paper].height / 2}</span><span>{paperDimensions[paper].height} mm</span></div>
            {activeItem ? (
              <ProductLabel item={activeItem} paper={paper} fields={fields} brandText={brandText} customNote={customNote} calibration={calibration} />
            ) : (
              <div className="preview-placeholder">从左侧选择一个商品规格</div>
            )}
          </div>
          <div className="print-hint">
            <IconPrinter />
            <span><b>首次打印建议先打印 1 张测试页</b>浏览器打印设置中请选择实际标签机，并关闭页眉页脚、缩放设为 100%。</span>
          </div>
        </section>

        <aside className="label-settings-panel">
          <div className="panel-heading">
            <div><b>标签内容配置</b><span>主条码固定显示，其余内容可自定义</span></div>
            <span className={`settings-save-status ${saveStatus}`}>
              {saveStatus === 'loading' ? '读取设置…' : saveStatus === 'saving' ? '正在保存…' : saveStatus === 'error' ? '保存失败' : '已保存到数据库'}
            </span>
          </div>
          <div className="setting-list">
            {fieldLabels.map(([field, label]) => {
              const disabled = field === 'image' && !activeItem?.imageUrl;
              return (
                <label className={disabled ? 'setting-row disabled' : 'setting-row'} key={field}>
                  <span>{field === 'image' && <IconPhoto />}{label}{disabled && <small>商品未设置图片</small>}</span>
                  <input
                    type="checkbox"
                    checked={fields[field] && !disabled}
                    disabled={disabled}
                    onChange={event => setFields(current => ({ ...current, [field]: event.target.checked }))}
                  />
                </label>
              );
            })}
          </div>
          <div className="settings-section">
            <label>品牌标识文字</label>
            <input
              type="text"
              value={brandText}
              onChange={event => setBrandText(event.target.value.slice(0, 30))}
              placeholder="例如：媛媛和小肥朱"
              maxLength={30}
            />
            <small>{brandText.length} / 30</small>
          </div>
          <div className="settings-section">
            <label>自定义备注</label>
            <textarea
              value={customNote}
              onChange={event => setCustomNote(event.target.value)}
              placeholder={activeItem?.note || '例如：仓库货位、活动批次'}
              maxLength={60}
            />
            <small>{customNote.length} / 60</small>
          </div>
          <div className="settings-section">
            <div className="settings-section-title">
              <span><IconAdjustmentsHorizontal /> 打印校准</span>
              <button type="button" onClick={() => setCalibration({ x: 0, y: 0 })}>归零</button>
            </div>
            <p>标签整体偏移，用于修正不同打印机的进纸误差。</p>
            <label>水平偏移（mm）</label>
            <input
              type="number"
              min="-5"
              max="5"
              step="0.5"
              value={calibration.x}
              onChange={event => setCalibration(current => ({ ...current, x: Number(event.target.value) || 0 }))}
            />
            <label>垂直偏移（mm）</label>
            <input
              type="number"
              min="-5"
              max="5"
              step="0.5"
              value={calibration.y}
              onChange={event => setCalibration(current => ({ ...current, y: Number(event.target.value) || 0 }))}
            />
          </div>
        </aside>
      </div>

      <div className="print-only-labels" aria-hidden="true">
        {printableItems.map(item => (
          <ProductLabel
            key={`${item.skuId}-${item.copyIndex}`}
            item={item}
            paper={paper}
            fields={fields}
            brandText={brandText}
            customNote={customNote}
            calibration={calibration}
            print
          />
        ))}
      </div>
    </div>
  );
}
