// Per-type Thai business document layouts (demo, mock data).
// Each layout shows fields appropriate for that doc type.

import { ReactNode } from "react";

const COMPANY = {
  th: "บริษัท พีโอนี เอ็มทีโอ จำกัด",
  en: "Peony MTO Co., Ltd. (สำนักงานใหญ่)",
  address: "123 ถ.พระราม 9 แขวงห้วยขวาง เขตห้วยขวาง กรุงเทพฯ 10310",
  taxId: "เลขประจำตัวผู้เสียภาษี 0105563000000",
  bank: "ธ.กรุงเทพ 123-4-56789-0 ชื่อบัญชี บริษัท พีโอนี เอ็มทีโอ จำกัด",
};

const CUSTOMER = {
  name: "บริษัท อนันต์ พรีซิชั่น จำกัด",
  address: "456 นิคมอุตสาหกรรมบางปะอิน อยุธยา 13160",
  taxId: "0105560000000",
  branch: "สำนักงานใหญ่",
  contact: "คุณอนันต์ • 02-555-1234 • anan@example.com",
};

const SUPPLIER = {
  name: "บริษัท ธนศักดิ์ เมทัล จำกัด",
  address: "78 นิคมอุตสาหกรรมบางพลี สมุทรปราการ",
  taxId: "0105561111111",
  contact: "คุณธนา • 02-777-9000",
};

const ITEMS = [
  { name: "Precision Jig Type A", number: "PJ-A-12", qty: 50, unit: "ชิ้น", unitPrice: 7200, discount: 0 },
  { name: "Mounting Plate", number: "MP-44", qty: 50, unit: "ชิ้น", unitPrice: 2400, discount: 0 },
];

const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function Header({ title, en, number, date, extra }: { title: string; en: string; number: string; date: string; extra?: ReactNode }) {
  return (
    <div className="flex flex-wrap justify-between items-start border-b pb-3 gap-3">
      <div className="text-sm">
        <div className="font-display text-lg font-semibold">{COMPANY.th}</div>
        <div className="text-xs text-muted-foreground">{COMPANY.en}</div>
        <div className="text-xs">{COMPANY.address}</div>
        <div className="text-xs">{COMPANY.taxId}</div>
      </div>
      <div className="text-right text-xs">
        <div className="font-semibold text-base">{title}</div>
        <div className="text-muted-foreground">{en}</div>
        <div className="mt-2">เลขที่ <b>{number}</b></div>
        <div>วันที่ {date}</div>
        {extra}
      </div>
    </div>
  );
}

function Party({ label, name, address, taxId, branch, contact }: { label: string; name: string; address?: string; taxId?: string; branch?: string; contact?: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{name}</div>
      {address && <div className="text-xs">{address}</div>}
      {(taxId || branch) && <div className="text-xs">{taxId && `เลขผู้เสียภาษี ${taxId}`}{branch && ` • สาขา${branch}`}</div>}
      {contact && <div className="text-xs">{contact}</div>}
    </div>
  );
}

function ItemTable({ showCost = false }: { showCost?: boolean }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left text-xs text-muted-foreground">
          <th className="py-1">รายการ</th>
          <th className="py-1">Part No.</th>
          <th className="py-1 text-right">จำนวน</th>
          <th className="py-1 text-right">หน่วย</th>
          <th className="py-1 text-right">{showCost ? "ราคาทุน" : "ราคา/หน่วย"}</th>
          <th className="py-1 text-right">ส่วนลด</th>
          <th className="py-1 text-right">รวม</th>
        </tr>
      </thead>
      <tbody>
        {ITEMS.map((it, i) => (
          <tr key={i} className="border-b last:border-0">
            <td className="py-1.5">{it.name}</td>
            <td className="py-1.5">{it.number}</td>
            <td className="py-1.5 text-right">{it.qty}</td>
            <td className="py-1.5 text-right">{it.unit}</td>
            <td className="py-1.5 text-right">{fmt(it.unitPrice)}</td>
            <td className="py-1.5 text-right">{fmt(it.discount)}</td>
            <td className="py-1.5 text-right">{fmt(it.qty * it.unitPrice - it.discount)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Totals({ withWHT, withVAT = true }: { withWHT?: boolean; withVAT?: boolean }) {
  const sub = ITEMS.reduce((s, it) => s + it.qty * it.unitPrice - it.discount, 0);
  const vat = withVAT ? Math.round(sub * 0.07) : 0;
  const wht = withWHT ? Math.round(sub * 0.03) : 0;
  const total = sub + vat - wht;
  return (
    <div className="flex justify-end">
      <div className="w-64 space-y-1 text-sm">
        <div className="flex justify-between"><span>รวมเงิน</span><span>{fmt(sub)}</span></div>
        {withVAT && <div className="flex justify-between"><span>ภาษีมูลค่าเพิ่ม 7%</span><span>{fmt(vat)}</span></div>}
        {withWHT && <div className="flex justify-between text-destructive"><span>หัก ณ ที่จ่าย 3%</span><span>−{fmt(wht)}</span></div>}
        <div className="flex justify-between font-semibold border-t pt-1"><span>ยอดสุทธิ (บาท)</span><span>{fmt(total)}</span></div>
      </div>
    </div>
  );
}

function Signatures({ labels }: { labels: string[] }) {
  return (
    <div className={`grid gap-6 pt-8 text-center text-xs grid-cols-${labels.length}`} style={{ gridTemplateColumns: `repeat(${labels.length}, minmax(0, 1fr))` }}>
      {labels.map((l) => (
        <div key={l}>
          <div className="h-12" />
          <div className="border-t pt-1">{l}</div>
          <div className="text-muted-foreground">(....................................)</div>
        </div>
      ))}
    </div>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="border rounded-md p-4 sm:p-6 bg-white text-foreground space-y-4 text-sm max-h-[70vh] overflow-y-auto">
      {children}
      <div className="text-[10px] text-muted-foreground text-center pt-2">เอกสารตัวอย่างสำหรับเดโม Peony Business OS</div>
    </div>
  );
}

// -------- Per-type layouts --------

export function ThaiDocLayout({
  docTypeId,
  number = "DOC-2026-0001",
  leadStages,
}: {
  docTypeId: string;
  number?: string;
  leadStages?: { name: string; start: string; end: string }[];
}) {
  const today = new Date().toISOString().slice(0, 10);

  switch (docTypeId) {
    case "td1": // ใบเสนอราคา / Quotation
      return (
        <Shell>
          <Header title="ใบเสนอราคา" en="Quotation" number={number} date={today}
            extra={<><div>ใช้ได้ถึง 30 วัน</div><div>เครดิต 30 วัน</div></>} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b pb-3">
            <Party label="เสนอราคาให้" {...CUSTOMER} />
            <div className="text-xs space-y-0.5">
              <div><b>โปรเจกต์:</b> Batch 12 — Precision Jig</div>
              <div><b>เลขที่อ้างอิง:</b> RFQ-2026-118</div>
              <div><b>พนักงานขาย:</b> คุณพลอย</div>
              <div><b>คลังจัดส่ง:</b> คลังหลัก</div>
              <div><b>ราคา:</b> ไม่รวมภาษี (เพิ่ม VAT 7%)</div>
            </div>
          </div>
          <ItemTable />
          <Totals withVAT withWHT />
          {leadStages && leadStages.length > 0 && (
            <div className="border rounded-md p-3 bg-muted/30 text-xs">
              <div className="font-semibold mb-2">กำหนดระยะเวลาดำเนินงานโดยประมาณ</div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="py-1 text-left">ขั้นตอน</th>
                    <th className="py-1 text-left">วันที่เริ่ม</th>
                    <th className="py-1 text-left">วันที่สิ้นสุด</th>
                    <th className="py-1 text-right">ระยะเวลา</th>
                  </tr>
                </thead>
                <tbody>
                  {leadStages.map((s, i) => {
                    const days = Math.max(1, Math.round((new Date(s.end).getTime() - new Date(s.start).getTime()) / 86400000) + 1);
                    return (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-1 font-medium">{s.name}</td>
                        <td className="py-1">{s.start}</td>
                        <td className="py-1">{s.end}</td>
                        <td className="py-1 text-right">{days} วัน</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="mt-2 text-[11px] text-muted-foreground">
                * กำหนดการเป็นการประมาณ อาจปรับเปลี่ยนตามความพร้อมของวัตถุดิบและการอนุมัติแบบ
              </div>
            </div>
          )}
          <div className="text-xs text-muted-foreground"><b>หมายเหตุ:</b> ราคามีผล 30 วัน • โอน 50% ก่อนเริ่มงาน • รับประกัน 1 ปี</div>
          <Signatures labels={["ผู้จัดทำ", "ผู้ตรวจสอบ", "ผู้อนุมัติ"]} />
        </Shell>
      );

    case "td2": // ใบวางบิล / Billing Note
      return (
        <Shell>
          <Header title="ใบวางบิล" en="Billing Note" number={number} date={today}
            extra={<><div>รอบบิล: 16 พ.ค. – 31 พ.ค. 2026</div><div>ครบกำหนดเก็บ 15/06/2026</div></>} />
          <div className="border-b pb-3"><Party label="วางบิลถึง" {...CUSTOMER} /></div>
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-xs text-muted-foreground">
              <th className="py-1">เลขที่ใบแจ้งหนี้</th><th className="py-1">วันที่</th><th className="py-1">PO อ้างอิง</th>
              <th className="py-1 text-right">จำนวนเงิน (รวม VAT)</th>
            </tr></thead>
            <tbody>
              {[
                { n: "INV-2026-0042", d: "18/05/2026", po: "PO-882", t: 64200 },
                { n: "INV-2026-0044", d: "22/05/2026", po: "PO-885", t: 117700 },
                { n: "INV-2026-0046", d: "28/05/2026", po: "PO-889", t: 256800 },
              ].map((r) => (
                <tr key={r.n} className="border-b last:border-0">
                  <td className="py-1.5">{r.n}</td><td>{r.d}</td><td>{r.po}</td>
                  <td className="text-right">{fmt(r.t)}</td>
                </tr>
              ))}
              <tr><td colSpan={3} className="py-2 text-right font-semibold">รวมยอดวางบิล</td>
                <td className="py-2 text-right font-bold">{fmt(64200 + 117700 + 256800)}</td></tr>
            </tbody>
          </table>
          <div className="text-xs text-muted-foreground"><b>หมายเหตุ:</b> กรุณาเตรียมเช็ค/โอนตามวันครบกำหนด • ติดต่อบัญชี 02-777-9999</div>
          <Signatures labels={["ผู้วางบิล", "ผู้รับวางบิล"]} />
        </Shell>
      );

    case "td3": // ใบรวมบิล / Combined Billing
      return (
        <Shell>
          <Header title="ใบรวมบิล" en="Combined Billing" number={number} date={today}
            extra={<div>รวม 3 ใบแจ้งหนี้ / 2 งาน</div>} />
          <div className="border-b pb-3"><Party label="ลูกค้า" {...CUSTOMER} /></div>
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-xs text-muted-foreground">
              <th className="py-1">งาน</th><th className="py-1">ใบแจ้งหนี้</th><th className="py-1">วันที่</th>
              <th className="py-1 text-right">ก่อน VAT</th><th className="py-1 text-right">VAT</th><th className="py-1 text-right">รวม</th>
            </tr></thead>
            <tbody>
              {[
                { j: "JOB-2026-0007", n: "INV-2026-0042", d: "18/05/2026", a: 60000 },
                { j: "JOB-2026-0007", n: "INV-2026-0044", d: "22/05/2026", a: 110000 },
                { j: "JOB-2026-0010", n: "INV-2026-0046", d: "28/05/2026", a: 240000 },
              ].map((r) => (
                <tr key={r.n} className="border-b last:border-0">
                  <td className="py-1.5">{r.j}</td><td>{r.n}</td><td>{r.d}</td>
                  <td className="text-right">{fmt(r.a)}</td>
                  <td className="text-right">{fmt(r.a * 0.07)}</td>
                  <td className="text-right">{fmt(r.a * 1.07)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Totals withVAT withWHT />
          <Signatures labels={["ผู้จัดทำ", "ผู้อนุมัติ"]} />
        </Shell>
      );

    case "td4": // ใบส่งสินค้า / Delivery Note
      return (
        <Shell>
          <Header title="ใบส่งสินค้า" en="Delivery Note" number={number} date={today}
            extra={<><div>วันที่ส่ง {today}</div><div>รถส่ง: TY Hilux ทะเบียน ขข-1234</div></>} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b pb-3">
            <Party label="ส่งถึง" name={CUSTOMER.name} address={CUSTOMER.address} contact="ผู้รับ: คุณอนันต์" />
            <div className="text-xs space-y-0.5">
              <div><b>PO อ้างอิง:</b> PO-882</div>
              <div><b>งาน:</b> JOB-2026-0007</div>
              <div><b>คลังต้นทาง:</b> คลังหลัก</div>
              <div><b>วิธีการส่ง:</b> รถบริษัท</div>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-xs text-muted-foreground">
              <th className="py-1">รายการ</th><th className="py-1">Part No.</th>
              <th className="py-1 text-right">จำนวน</th><th className="py-1 text-right">หน่วย</th><th className="py-1">หมายเหตุ</th>
            </tr></thead>
            <tbody>
              {ITEMS.map((it, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-1.5">{it.name}</td><td>{it.number}</td>
                  <td className="text-right">{it.qty}</td><td className="text-right">{it.unit}</td>
                  <td className="text-xs text-muted-foreground">QC pass</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-xs text-muted-foreground"><b>หมายเหตุ:</b> กรุณาตรวจรับสินค้า หากพบเสียหายโปรดแจ้งภายใน 7 วัน</div>
          <Signatures labels={["ผู้ส่งสินค้า", "ผู้ขับรถ", "ผู้รับสินค้า"]} />
        </Shell>
      );

    case "td5": // ใบแจ้งหนี้ / Invoice
      return (
        <Shell>
          <Header title="ใบแจ้งหนี้" en="Invoice" number={number} date={today}
            extra={<><div>วันที่ออก {today}</div><div>เครดิต 30 วัน</div><div>ครบกำหนด 15/07/2026</div><div className="text-amber-700">สถานะ: ยังไม่ชำระ</div></>} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b pb-3">
            <Party label="เรียกเก็บจาก" {...CUSTOMER} />
            <div className="text-xs space-y-0.5">
              <div><b>PO อ้างอิง:</b> PO-882</div>
              <div><b>งาน:</b> JOB-2026-0007</div>
              <div><b>เงื่อนไขชำระ:</b> โอนเงิน 30 วัน</div>
            </div>
          </div>
          <ItemTable />
          <Totals withVAT withWHT />
          <div className="text-xs"><b>ช่องทางชำระ:</b> {COMPANY.bank}</div>
          <Signatures labels={["ผู้จัดทำ", "ผู้อนุมัติ"]} />
        </Shell>
      );

    case "td6": // ใบกำกับภาษี / Tax Invoice
      return (
        <Shell>
          <Header title="ใบกำกับภาษี / ใบแจ้งหนี้" en="Tax Invoice" number={number} date={today}
            extra={<><div>เลขที่ใบกำกับภาษี <b>TAX-{number}</b></div><div>VAT 7% (รวมภาษีในรายการ)</div></>} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b pb-3">
            <Party label="ผู้ขาย / ผู้ให้บริการ" name={COMPANY.th} address={COMPANY.address} taxId="0105563000000" branch="สำนักงานใหญ่" />
            <Party label="ผู้ซื้อ / ผู้รับบริการ" {...CUSTOMER} />
          </div>
          <ItemTable />
          <Totals withVAT />
          <div className="text-xs text-muted-foreground">เอกสารนี้ใช้แทนใบกำกับภาษีตามประมวลรัษฎากร</div>
          <Signatures labels={["ผู้จัดทำ", "ผู้อนุมัติ"]} />
        </Shell>
      );

    case "td7": // ใบเสร็จรับเงิน / Receipt
      return (
        <Shell>
          <Header title="ใบเสร็จรับเงิน" en="Receipt" number={number} date={today}
            extra={<><div>วันที่รับเงิน {today}</div><div>วิธีชำระ: โอนธนาคาร</div></>} />
          <div className="border-b pb-3"><Party label="ได้รับเงินจาก" {...CUSTOMER} /></div>
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-xs text-muted-foreground">
              <th className="py-1">รายการ / อ้างอิงใบแจ้งหนี้</th><th className="py-1 text-right">จำนวนเงิน</th>
            </tr></thead>
            <tbody>
              <tr className="border-b"><td className="py-1.5">INV-2026-0042 — Batch 12</td><td className="text-right">{fmt(64200)}</td></tr>
              <tr className="border-b"><td className="py-1.5">INV-2026-0044 — Mounting</td><td className="text-right">{fmt(117700)}</td></tr>
              <tr><td className="py-2 text-right font-semibold">รวมรับเงิน</td><td className="py-2 text-right font-bold">{fmt(181900)}</td></tr>
            </tbody>
          </table>
          <div className="text-sm"><b>จำนวนเงินตัวอักษร:</b> หนึ่งแสนแปดหมื่นหนึ่งพันเก้าร้อยบาทถ้วน</div>
          <Signatures labels={["ผู้รับเงิน", "ผู้ตรวจสอบ"]} />
        </Shell>
      );

    case "td8": // ใบสำคัญจ่าย / Payment Voucher
      return (
        <Shell>
          <Header title="ใบสำคัญจ่าย" en="Payment Voucher" number={number} date={today}
            extra={<><div>วิธีจ่าย: โอนธนาคาร</div><div>วันที่ลงเช็ค: —</div></>} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b pb-3">
            <Party label="จ่ายให้" {...SUPPLIER} />
            <div className="text-xs space-y-0.5">
              <div><b>เลขที่บิล:</b> SB-2026-0011</div>
              <div><b>งานที่เกี่ยวข้อง:</b> JOB-2026-0007</div>
              <div><b>ลูกค้าที่เกี่ยวข้อง:</b> {CUSTOMER.name}</div>
              <div><b>เลขที่เช็ค:</b> —</div>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-xs text-muted-foreground">
              <th className="py-1">รายละเอียดการจ่าย</th><th className="py-1 text-right">จำนวนเงิน</th>
            </tr></thead>
            <tbody>
              <tr className="border-b"><td className="py-1.5">ค่าวัตถุดิบ S45C billet 60 ชิ้น</td><td className="text-right">{fmt(108000)}</td></tr>
              <tr><td className="py-2 text-right font-semibold">รวมจ่าย</td><td className="py-2 text-right font-bold">{fmt(108000)}</td></tr>
            </tbody>
          </table>
          <div className="text-sm"><b>จำนวนเงินตัวอักษร:</b> หนึ่งแสนแปดพันบาทถ้วน</div>
          <Signatures labels={["ผู้รับเงิน", "ผู้จ่ายเงิน", "ผู้อนุมัติ"]} />
        </Shell>
      );

    case "td9": // ใบสั่งซื้อ / Purchase Order
      return (
        <Shell>
          <Header title="ใบสั่งซื้อ" en="Purchase Order" number={number} date={today}
            extra={<><div>คาดว่าจะได้รับ 12/06/2026</div><div>เงื่อนไขชำระ 30 วัน</div></>} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b pb-3">
            <Party label="ซัพพลายเออร์" {...SUPPLIER} />
            <div className="text-xs space-y-0.5">
              <div><b>ส่งของถึง:</b> คลังหลัก {COMPANY.address}</div>
              <div><b>งานอ้างอิง:</b> JOB-2026-0007</div>
              <div><b>ผู้ขอซื้อ:</b> คุณสมชาย</div>
            </div>
          </div>
          <ItemTable showCost />
          <Totals withVAT />
          <div className="text-xs text-muted-foreground"><b>หมายเหตุ:</b> ใบสั่งซื้อนี้มีผลเมื่อได้รับการยืนยันจากซัพพลายเออร์</div>
          <Signatures labels={["ผู้จัดทำ", "ผู้อนุมัติ", "ซัพพลายเออร์ยืนยัน"]} />
        </Shell>
      );

    case "td10": // ใบรับสินค้า / Goods Receipt
      return (
        <Shell>
          <Header title="ใบรับสินค้า" en="Goods Receipt" number={number} date={today}
            extra={<><div>วันที่รับ {today}</div><div>PO อ้างอิง: PO-2026-024</div></>} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b pb-3">
            <Party label="ซัพพลายเออร์" {...SUPPLIER} />
            <div className="text-xs space-y-0.5">
              <div><b>คลังที่รับเข้า:</b> คลังหลัก</div>
              <div><b>ผู้รับ:</b> คุณวิทย์</div>
              <div><b>ผู้ตรวจ QC:</b> คุณสมชาย</div>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-xs text-muted-foreground">
              <th className="py-1">รายการ</th><th className="py-1">Part No.</th>
              <th className="py-1 text-right">สั่ง</th><th className="py-1 text-right">รับจริง</th><th className="py-1">QC</th>
            </tr></thead>
            <tbody>
              {ITEMS.map((it, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-1.5">{it.name}</td><td>{it.number}</td>
                  <td className="text-right">{it.qty}</td>
                  <td className="text-right">{it.qty}</td>
                  <td><span className="text-success">ผ่าน</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-xs text-muted-foreground"><b>หมายเหตุ QC:</b> สินค้าครบ ไม่พบของเสียหาย</div>
          <Signatures labels={["ผู้ส่งของ (Supplier)", "ผู้รับสินค้า", "ผู้ตรวจ QC"]} />
        </Shell>
      );

    default:
      return (
        <Shell>
          <Header title="เอกสาร" en="Document" number={number} date={today} />
          <ItemTable />
          <Totals withVAT />
        </Shell>
      );
  }
}
