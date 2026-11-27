import { useState } from 'react';
import { toast } from 'react-toastify';
import { CheckCircle2, RefreshCw, Wallet, Clock, Receipt, Download, Printer, FileText, Copy, Check } from 'lucide-react';
import { api, errMsg, pkr, fmtDate, currentMonth, monthLabel } from '../api';
import { useFetch } from '../hooks';
import { useAuth } from '../context/AuthContext';
import { PageHeader, Stat, Badge, Spinner, Empty, Modal } from '../components/ui';
import { FEE_LABEL, EASYPAISA_ACCOUNT } from '../constants';

export default function Fees() {
  const { user } = useAuth();
  const staff = user.role !== 'STUDENT';
  const [month, setMonth] = useState(currentMonth());
  const [status, setStatus] = useState('');
  const [activeSlip, setActiveSlip] = useState(null);
  const [copiedEp, setCopiedEp] = useState(false);
  const { data, loading, reload } = useFetch(`/fees?month=${staff ? month : ''}&status=${status}`, [month, status]);
  const { data: st } = useFetch('/fees/structure');
  const paid = (data || []).filter((f) => f.status === 'PAID').reduce((a, f) => a + f.amount, 0);
  const due = (data || []).filter((f) => f.status === 'UNPAID').reduce((a, f) => a + f.amount, 0);

  const copyEasypaisa = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(EASYPAISA_ACCOUNT.number);
    }
    setCopiedEp(true);
    toast.success(`Easypaisa number copied: ${EASYPAISA_ACCOUNT.number}`);
    setTimeout(() => setCopiedEp(false), 2000);
  };

  const generate = async () => {
    try { const { data: r } = await api.post('/fees/generate', { month }); toast.success(`${r.created} fee entries created`); reload(); } catch (e) { toast.error(errMsg(e)); }
  };
  const pay = async (f, method) => { try { await api.put(`/fees/${f._id}/pay`, { method }); toast.success('Marked as paid'); reload(); } catch (e) { toast.error(errMsg(e)); } };

  const openSlip = (fee) => {
    setActiveSlip({
      isConsolidated: false,
      title: `${FEE_LABEL[fee.type] || 'Fee'} Slip · ${monthLabel(fee.month)}`,
      slipNo: `SE-${fee._id.slice(-6).toUpperCase()}`,
      month: fee.month,
      student: fee.student?.name ? fee.student : user,
      items: [{ label: FEE_LABEL[fee.type] || fee.type, amount: fee.amount, status: fee.status, paidOn: fee.paidOn, method: fee.method }],
      total: fee.amount,
      status: fee.status,
      paidOn: fee.paidOn,
      method: fee.method,
    });
  };

  const openMonthSlip = () => {
    const studentFees = (data || []).filter((f) => !month || f.month === month);
    if (!studentFees.length) return toast.error('No fee records found for this month');
    const total = studentFees.reduce((a, f) => a + f.amount, 0);
    const allPaid = studentFees.every((f) => f.status === 'PAID');
    const anyPaid = studentFees.some((f) => f.status === 'PAID');
    const overallStatus = allPaid ? 'PAID' : anyPaid ? 'PARTIAL' : 'UNPAID';
    const targetMonth = month || studentFees[0]?.month;

    setActiveSlip({
      isConsolidated: true,
      title: `Monthly Fee Slip · ${monthLabel(targetMonth)}`,
      slipNo: `SE-${(targetMonth || 'M').replace('-', '')}-${(user?.rollNo || '001').replace(/[^a-zA-Z0-9]/g, '')}`,
      month: targetMonth,
      student: user,
      items: studentFees.map((f) => ({
        label: FEE_LABEL[f.type] || f.type,
        amount: f.amount,
        status: f.status,
        paidOn: f.paidOn,
        method: f.method,
      })),
      total,
      status: overallStatus,
      paidOn: allPaid ? studentFees[0]?.paidOn : null,
      method: allPaid ? studentFees[0]?.method : null,
    });
  };

  const getSlipHtml = (slip) => {
    const sName = slip.student?.name || user?.name || 'Student';
    const sRoll = slip.student?.rollNo || user?.rollNo || '—';
    const sClass = slip.student?.className || user?.className || '—';
    const sGuardian = slip.student?.guardianName || user?.guardianName || '—';
    const dateStr = new Date().toLocaleDateString('en-GB', { timeZone: 'Asia/Karachi' }).replace(/\//g, '-');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Fee Slip - ${sName} (${sRoll}) - ${slip.month}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: #f8fafc; padding: 24px; color: #0f172a; }
    .slip { max-width: 660px; margin: 0 auto; background: #fff; border: 2px solid #0f172a; border-radius: 12px; padding: 28px; box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
    .header { text-align: center; border-bottom: 2px solid #0b2540; padding-bottom: 14px; margin-bottom: 18px; }
    .header h1 { font-size: 20px; font-weight: 800; color: #0b2540; text-transform: uppercase; margin-bottom: 4px; }
    .header p { font-size: 13px; color: #475569; margin: 2px 0; }
    .tag { display: inline-block; background: #0b2540; color: #fff; font-size: 11px; font-weight: 700; padding: 3px 12px; border-radius: 99px; text-transform: uppercase; margin-top: 6px; letter-spacing: 0.5px; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 18px; background: #f1f5f9; padding: 12px 16px; border-radius: 8px; font-size: 13px; }
    .meta div span { color: #64748b; font-size: 11.5px; display: block; }
    .meta div strong { color: #0f172a; font-weight: 600; font-size: 13.5px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 18px; font-size: 13px; }
    th { background: #f8fafc; border-top: 1px solid #e2e8f0; border-bottom: 2px solid #0f172a; padding: 10px 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #334155; }
    td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; }
    .tar { text-align: right; }
    .total-tr td { font-weight: 800; font-size: 15px; background: #f8fafc; border-top: 2px solid #0f172a; border-bottom: 2px solid #0f172a; color: #0b2540; }
    .badge { display: inline-block; padding: 2px 10px; border-radius: 99px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .badge-PAID { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
    .badge-UNPAID { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
    .badge-PARTIAL { background: #fef3c7; color: #92400e; border: 1px solid #fcd34d; }
    .info { font-size: 11.5px; color: #475569; background: #f8fafc; border-left: 3px solid #0e7490; padding: 10px 14px; border-radius: 6px; line-height: 1.5; margin-bottom: 24px; }
    .footer { display: flex; justify-content: space-between; margin-top: 36px; padding-top: 10px; }
    .sign { width: 180px; text-align: center; border-top: 1px dashed #64748b; padding-top: 6px; font-size: 11.5px; color: #475569; }
    .no-print { text-align: center; margin-bottom: 16px; }
    .btn { background: #0e7490; color: #fff; border: 0; padding: 8px 18px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; }
    @media print {
      body { background: transparent; padding: 0; }
      .no-print { display: none !important; }
      .slip { box-shadow: none; border: 1.5px solid #000; max-width: 100%; border-radius: 0; }
    }
  </style>
</head>
<body>
  <div class="no-print">
    <button class="btn" onclick="window.print()">Print / Save as PDF</button>
  </div>
  <div class="slip">
    <div class="header">
      <h1>Shan Elegance Public School & Hostel</h1>
      <p>Skardu, Gilgit-Baltistan · Tel: +92 355 0000000</p>
      <div class="tag">Fee Challan & Receipt</div>
    </div>
    <div class="meta">
      <div><span>Challan / Slip No</span><strong>${slip.slipNo}</strong></div>
      <div><span>Issue Date</span><strong>${dateStr}</strong></div>
      <div><span>Billing Month</span><strong>${monthLabel(slip.month)}</strong></div>
      <div><span>Overall Status</span><strong><span class="badge badge-${slip.status}">${slip.status}</span></strong></div>
      <div><span>Student Name</span><strong>${sName}</strong></div>
      <div><span>Roll Number</span><strong>${sRoll}</strong></div>
      <div><span>Class</span><strong>${sClass}</strong></div>
      <div><span>Guardian</span><strong>${sGuardian}</strong></div>
    </div>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Fee Particulars</th>
          <th>Status</th>
          <th class="tar">Amount (PKR)</th>
        </tr>
      </thead>
      <tbody>
        ${slip.items.map((it, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td><strong>${it.label}</strong>${it.paidOn ? `<br><small style="color:#64748b; font-size:11px;">Paid on ${fmtDate(it.paidOn)}${it.method ? ` (${it.method})` : ''}</small>` : ''}</td>
            <td><span class="badge badge-${it.status}">${it.status}</span></td>
            <td class="tar">${pkr(it.amount)}</td>
          </tr>
        `).join('')}
        <tr class="total-tr">
          <td colspan="3">Total Amount</td>
          <td class="tar">${pkr(slip.total)}</td>
        </tr>
      </tbody>
    </table>
    <div class="info">
      <strong>Payment Information:</strong><br />
      • <strong>Easypaisa Account:</strong> <span style="font-size:14px; font-weight:700; color:#0e7490;">${EASYPAISA_ACCOUNT.number}</span> (Title: <strong>${EASYPAISA_ACCOUNT.title}</strong>)<br />
      • Please mention Student Roll No <strong>${sRoll}</strong> in the Easypaisa remarks / note.<br />
      • Fee can also be paid at School Accounts Office (Cash) or via JazzCash / Bank Transfer.<br />
      • Please retain this receipt / challan slip for verification.
    </div>
    <div class="footer">
      <div class="sign">Accounts Officer<br />Shan Elegance Skardu</div>
      <div class="sign">Student / Depositor<br />Signature</div>
    </div>
  </div>
</body>
</html>`;
  };

  const printSlip = (slip) => {
    const w = window.open('', '_blank');
    if (!w) return toast.error('Please allow popups to print fee slip');
    w.document.write(getSlipHtml(slip));
    w.document.close();
    w.focus();
    setTimeout(() => {
      w.print();
    }, 350);
  };

  const downloadSlip = (slip) => {
    const html = getSlipHtml(slip);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const sRoll = slip.student?.rollNo || user?.rollNo || 'Student';
    a.download = `Fee-Slip-${sRoll}-${slip.month || 'slip'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Fee slip downloaded successfully');
  };

  return (
    <>
      <PageHeader
        title={staff ? 'Fee Management' : 'My Fees'}
        sub={staff ? `All amounts in Pakistani Rupees (PKR) · ${monthLabel(month)}` : 'Hostel, mess and transport dues'}
      >
        {staff ? (
          <>
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All</option>
              <option value="UNPAID">Unpaid</option>
              <option value="PAID">Paid</option>
            </select>
            <button className="btn primary" onClick={generate}><RefreshCw size={16} />Generate month</button>
          </>
        ) : (
          <button className="btn primary" onClick={openMonthSlip}>
            <FileText size={16} />Download Month Slip
          </button>
        )}
      </PageHeader>
      <div className="grid-3">
        <Stat icon={Wallet} label="Collected" value={pkr(paid)} tone="green" />
        <Stat icon={Clock} label="Pending" value={pkr(due)} tone="amber" />
        <Stat icon={Receipt} label="Entries" value={data?.length || 0} />
      </div>

      {!staff && (
        <div className="easypaisa-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="ep-badge">Easypaisa Payment</span>
              <h3 style={{ margin: 0, color: '#fff', fontSize: 16 }}>Official Fee Payment Channel</h3>
            </div>
            <small style={{ color: '#bae6fd' }}>Shan Elegance Public School & Hostel</small>
          </div>
          <div className="ep-row">
            <div>
              <small style={{ color: '#e0f2fe', textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 11 }}>Easypaisa Account Number</small>
              <div className="ep-num">{EASYPAISA_ACCOUNT.number}</div>
              <small style={{ color: '#bae6fd' }}>Account Title: <b>{EASYPAISA_ACCOUNT.title}</b></small>
            </div>
            <button type="button" className="ep-copy-btn" onClick={copyEasypaisa}>
              {copiedEp ? <Check size={16} /> : <Copy size={16} />}
              {copiedEp ? 'Copied!' : 'Copy Number'}
            </button>
          </div>
          <p className="ep-instructions" style={{ margin: 0 }}>
            {EASYPAISA_ACCOUNT.instructions}
          </p>
        </div>
      )}

      <div className="card table-wrap">
        {loading ? <Spinner /> : !data?.length ? <Empty>No fee entries{staff ? ' — click “Generate month”.' : '.'}</Empty> : (
          <table>
            <thead>
              <tr>
                {staff && <th>Student</th>}
                <th>Month</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Paid on</th>
                <th>Fee Slip</th>
                {staff && <th />}
              </tr>
            </thead>
            <tbody>
              {data.map((f) => (
                <tr key={f._id}>
                  {staff && (
                    <td>
                      <b>{f.student?.name}</b>
                      <small>{f.student?.rollNo} {f.student?.className ? `· ${f.student?.className}` : ''}</small>
                    </td>
                  )}
                  <td>{f.month}</td>
                  <td>{FEE_LABEL[f.type] || f.type}</td>
                  <td>{pkr(f.amount)}</td>
                  <td><Badge tone={f.status === 'PAID' ? 'green' : 'red'}>{f.status}</Badge></td>
                  <td>{fmtDate(f.paidOn)}{f.method && <small>{f.method}</small>}</td>
                  <td>
                    <button className="btn ghost sm" onClick={() => openSlip(f)} title="View & Download Fee Slip">
                      <Download size={14} /> Slip
                    </button>
                  </td>
                  {staff && (
                    <td>
                      {f.status === 'UNPAID' && (
                        <select className="mini" defaultValue="" onChange={(e) => e.target.value && pay(f, e.target.value)}>
                          <option value="">Mark paid…</option>
                          <option>Cash</option>
                          <option>JazzCash</option>
                          <option>Easypaisa</option>
                          <option>Bank transfer</option>
                        </select>
                      )}
                      {f.status === 'PAID' && <CheckCircle2 size={18} color="#16a34a" />}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {st && (
        <div className="card">
          <h3>Fee structure (per month)</h3>
          <div className="grid-3 fee-struct">
            <div><h4>Hostel rent / bed</h4>{(st.hostel || []).map((h) => <p key={h.beds}>{h.beds}-bed room <b>{pkr(h.rent)}</b></p>)}</div>
            <div><h4>Mess & heating</h4><p>Mess (3 meals) <b>{pkr(st.mess)}</b></p><p>Winter heating (Nov–Mar) <b>{pkr(st.heating)}</b></p></div>
            <div><h4>Transport</h4>{(st.transport || []).map((t) => <p key={t.route}>{t.route} <b>{pkr(t.fee)}</b></p>)}</div>
          </div>
        </div>
      )}

      {activeSlip && (
        <Modal title={activeSlip.title} onClose={() => setActiveSlip(null)} wide>
          <div className="fee-slip-preview">
            <div className="fee-slip-head">
              <h2>Shan Elegance Public School & Hostel</h2>
              <p>Skardu, Gilgit-Baltistan · Student Fee Challan & Receipt</p>
            </div>
            <div className="fee-slip-meta">
              <div><span>Slip Number</span><strong>{activeSlip.slipNo}</strong></div>
              <div><span>Billing Month</span><strong>{monthLabel(activeSlip.month)}</strong></div>
              <div><span>Student Name</span><strong>{activeSlip.student?.name || user?.name}</strong></div>
              <div><span>Roll Number</span><strong>{activeSlip.student?.rollNo || user?.rollNo || '—'}</strong></div>
              <div><span>Class</span><strong>{activeSlip.student?.className || user?.className || '—'}</strong></div>
              <div><span>Status</span><strong><Badge tone={activeSlip.status === 'PAID' ? 'green' : activeSlip.status === 'PARTIAL' ? 'amber' : 'red'}>{activeSlip.status}</Badge></strong></div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Particulars</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {activeSlip.items.map((it, idx) => (
                  <tr key={idx}>
                    <td><b>{it.label}</b>{it.paidOn && <small>Paid on {fmtDate(it.paidOn)} {it.method ? `(${it.method})` : ''}</small>}</td>
                    <td><Badge tone={it.status === 'PAID' ? 'green' : 'red'}>{it.status}</Badge></td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{pkr(it.amount)}</td>
                  </tr>
                ))}
                <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
                  <td colSpan={2}><b>Total Payable / Paid</b></td>
                  <td style={{ textAlign: 'right', fontSize: 16, color: '#0b2540' }}>{pkr(activeSlip.total)}</td>
                </tr>
              </tbody>
            </table>
            <div className="easypaisa-slip-box">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
                <span className="ep-badge">Easypaisa Online Transfer</span>
                <button type="button" className="btn sm ghost" onClick={copyEasypaisa} style={{ padding: '3px 8px', fontSize: 12 }}>
                  {copiedEp ? <Check size={14} /> : <Copy size={14} />} {EASYPAISA_ACCOUNT.number}
                </button>
              </div>
              <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5 }}>
                Pay via Easypaisa to Account: <b>{EASYPAISA_ACCOUNT.number}</b> (Title: <b>{EASYPAISA_ACCOUNT.title}</b>). Mention Roll No: <b>{activeSlip.student?.rollNo || user?.rollNo}</b> in transfer remarks.
              </p>
            </div>
          </div>
          <div className="fee-slip-actions">
            <button className="btn ghost" onClick={() => setActiveSlip(null)}>Close</button>
            <button className="btn ghost" onClick={() => downloadSlip(activeSlip)}><Download size={16} />Download Slip (HTML)</button>
            <button className="btn primary" onClick={() => printSlip(activeSlip)}><Printer size={16} />Print / Save as PDF</button>
          </div>
        </Modal>
      )}
    </>
  );
}
