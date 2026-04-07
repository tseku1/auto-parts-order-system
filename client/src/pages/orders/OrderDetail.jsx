import { useState, useEffect, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import Navbar from '../../components/Navbar'
import { AppContext } from '../../context/AppContext'

const STATUS_LABEL = {
  submitted: { text: 'Илгээсэн', color: 'bg-blue-100 text-blue-700' },
  assigned: { text: 'Боловсруулж байна', color: 'bg-purple-100 text-purple-700' },
  quote_sent: { text: 'Үнийн санал ирсэн', color: 'bg-yellow-100 text-yellow-700' },
  quote_approved: { text: 'Үнийн санал зөвшөөрсөн', color: 'bg-green-100 text-green-700' },
  quote_rejected: { text: 'Үнийн санал татгалзсан', color: 'bg-red-100 text-red-700' },
  prepayment_uploaded: { text: 'Урьдчилгаа хүлээгдэж байна', color: 'bg-orange-100 text-orange-700' },
  prepayment_verified: { text: 'Урьдчилгаа баталгаажсан', color: 'bg-teal-100 text-teal-700' },
  parts_ordered: { text: 'Эд анги захиалагдсан', color: 'bg-indigo-100 text-indigo-700' },
  shipped: { text: 'Тээвэрлэгдэж байна', color: 'bg-sky-100 text-sky-700' },
  arrived: { text: 'Монголд ирсэн', color: 'bg-cyan-100 text-cyan-700' },
  out_for_delivery: { text: 'Хүргэлтэнд гарсан', color: 'bg-lime-100 text-lime-700' },
  delivered: { text: 'Хүргэгдсэн', color: 'bg-emerald-100 text-emerald-700' },
  completed: { text: 'Дууссан', color: 'bg-gray-100 text-gray-600' },
  cancelled: { text: 'Цуцлагдсан', color: 'bg-red-100 text-red-500' },
}

// ── Section wrapper ───────────────────────────────────────────────────────────
const Section = ({ title, children }) => (
  <div className="bg-white rounded-2xl shadow p-6">
    <h3 className="text-base font-semibold text-gray-800 mb-4">{title}</h3>
    {children}
  </div>
)

// ── Info row ─────────────────────────────────────────────────────────────────
const Row = ({ label, value }) => (
  <div className="flex justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
    <span className="text-gray-500">{label}</span>
    <span className="text-gray-800 font-medium text-right max-w-xs">{value || '—'}</span>
  </div>
)

// ── Action button ─────────────────────────────────────────────────────────────
const ActionBtn = ({ onClick, children, variant = 'primary', disabled }) => {
  const base = 'px-5 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50'
  const variants = {
    primary: 'bg-black text-white hover:bg-gray-800',
    success: 'bg-green-600 text-white hover:bg-green-700',
    danger: 'bg-red-500 text-white hover:bg-red-600',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
  }
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]}`}>
      {children}
    </button>
  )
}

const OrderDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { backendUrl, userData } = useContext(AppContext)

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)

  // Form states
  const [quoteParts, setQuoteParts] = useState([])
  const [shippingCost, setShippingCost] = useState('')
  const [quoteNote, setQuoteNote] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [prepaymentUrl, setPrepaymentUrl] = useState('')
  const [finalPaymentUrl, setFinalPaymentUrl] = useState('')
  const [purchaseReceiptUrl, setPurchaseReceiptUrl] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [cargoCompany, setCargoCompany] = useState('')
  const [recipientName, setRecipientName] = useState('')

  const fetchOrder = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/orders/${id}`)
      if (data.success) {
        setOrder(data.order)
        // Quote form initialize
        if (data.order.parts) {
          setQuoteParts(data.order.parts.map(p => ({
            partNumber: p.partNumber,
            description: p.description || '',
            quantity: p.quantity || 1,
            unitPrice: '',
          })))
        }
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchOrder() }, [id])

  const action = async (endpoint, body = {}) => {
    setActing(true)
    try {
      const { data } = await axios.post(`${backendUrl}/api/orders/${id}/${endpoint}`, body)
      if (data.success) {
        toast.success(data.message)
        fetchOrder()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setActing(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-32 text-center text-gray-400">Уншиж байна...</div>
    </div>
  )

  if (!order) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-32 text-center text-gray-400">Захиалга олдсонгүй</div>
    </div>
  )

  const st = STATUS_LABEL[order.status] || { text: order.status, color: 'bg-gray-100 text-gray-600' }
  const role = userData?.role

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-24 px-4 sm:px-8 max-w-3xl mx-auto pb-10 flex flex-col gap-5">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <button onClick={() => navigate('/orders')} className="text-gray-400 hover:text-gray-600 text-sm mb-2 block">
              ← Буцах
            </button>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-800 font-mono">{order.orderNumber}</h1>
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${st.color}`}>{st.text}</span>
            </div>
            <p className="text-sm text-gray-400 mt-1">
              {new Date(order.createdAt).toLocaleString('mn-MN')}
            </p>
          </div>
        </div>

        {/* Машины мэдээлэл */}
        <Section title="🚗 Автомашин">
          <Row label="Марк" value={order.vehicle?.make} />
          <Row label="Загвар" value={order.vehicle?.model} />
          <Row label="Он" value={order.vehicle?.year} />
          <Row label="Хөдөлгүүр" value={order.vehicle?.engine} />
        </Section>

        {/* Эд ангиуд */}
        <Section title="🔧 Захиалсан эд ангиуд">
          {order.parts?.map((p, i) => (
            <div key={i} className="border border-gray-100 rounded-xl p-4 mb-3 last:mb-0 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono font-semibold text-sm text-gray-800">{p.partNumber}</span>
                <span className="text-xs text-gray-500">x{p.quantity}</span>
              </div>
              {p.description && <p className="text-sm text-gray-600">{p.description}</p>}
              {p.notes && <p className="text-xs text-gray-400 mt-1">{p.notes}</p>}
              {p.imageUrl && (
                <a href={p.imageUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline mt-1 block">
                  🔗 Зураг/URL харах
                </a>
              )}
            </div>
          ))}
          {order.notes && <p className="text-sm text-gray-500 mt-3 pt-3 border-t">💬 {order.notes}</p>}
        </Section>

        {/* Захиалагч мэдээлэл (staff/admin) */}
        {role !== 'customer' && (
          <Section title="👤 Захиалагч">
            <Row label="Нэр" value={order.customer?.name} />
            <Row label="Имэйл" value={order.customer?.email} />
          </Section>
        )}

        {/* Үнийн санал харуулах */}
        {order.quote?.totalAmount && (
          <Section title="💰 Үнийн санал">
            {order.quote.parts?.map((p, i) => (
              <div key={i} className="flex justify-between text-sm py-1.5 border-b border-gray-50">
                <span className="text-gray-600">{p.partNumber} · x{p.quantity}</span>
                <span className="font-medium">${(p.unitPrice * p.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm py-1.5 border-b border-gray-50">
              <span className="text-gray-500">Тээвэрлэлт</span>
              <span>${order.quote.shippingCost?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm py-2 font-semibold">
              <span>Нийт дүн</span>
              <span>${order.quote.totalAmount?.toFixed(2)}</span>
            </div>
            {order.quote.note && <p className="text-sm text-gray-500 mt-2 pt-2 border-t">{order.quote.note}</p>}
            <div className="mt-2">
              <span className="text-xs text-gray-400">70% урьдчилгаа: </span>
              <span className="text-sm font-semibold">${(order.quote.totalAmount * 0.7).toFixed(2)}</span>
              <span className="text-xs text-gray-400 ml-3">30% үлдэгдэл: </span>
              <span className="text-sm font-semibold">${(order.quote.totalAmount * 0.3).toFixed(2)}</span>
            </div>
          </Section>
        )}

        {/* Тээвэрлэлтийн мэдээлэл */}
        {order.shipping?.trackingNumber && (
          <Section title="✈️ Тээвэрлэлт">
            <Row label="Карго компани" value={order.shipping.cargoCompany} />
            <Row label="Tracking дугаар" value={order.shipping.trackingNumber} />
            <Row label="Илгээсэн огноо" value={order.shipping.shippedAt ? new Date(order.shipping.shippedAt).toLocaleDateString('mn-MN') : null} />
          </Section>
        )}

        {/* Хүргэлтийн мэдээлэл */}
        {order.delivery?.deliveredAt && (
          <Section title="📦 Хүргэлт">
            <Row label="Хүлээн авагч" value={order.delivery.recipientName} />
            <Row label="Хүргэгдсэн огноо" value={new Date(order.delivery.deliveredAt).toLocaleDateString('mn-MN')} />
          </Section>
        )}

        {/* ── ACTIONS BY ROLE ── */}

        {/* US Staff: захиалга авах */}
        {role === 'us_staff' && order.status === 'submitted' && (
          <Section title="⚡ Үйлдэл">
            <p className="text-sm text-gray-500 mb-4">Захиалгыг өөртөө авч боловсруулна уу.</p>
            <ActionBtn onClick={() => action('assign')} disabled={acting}>
              Захиалга авах
            </ActionBtn>
          </Section>
        )}

        {/* US Staff: үнийн санал илгээх */}
        {role === 'us_staff' && ['assigned', 'quote_rejected'].includes(order.status) &&
          order.assignedTo?._id === userData?._id && (
          <Section title="💰 Үнийн санал илгээх">
            <div className="flex flex-col gap-3">
              {quoteParts.map((p, i) => (
                <div key={i} className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Part: {p.partNumber} x{p.quantity}</p>
                    <input
                      type="text"
                      placeholder="Тайлбар"
                      value={p.description}
                      onChange={e => setQuoteParts(prev => prev.map((q, j) => j === i ? { ...q, description: e.target.value } : q))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Нэгж үнэ ($)</p>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={p.unitPrice}
                      onChange={e => setQuoteParts(prev => prev.map((q, j) => j === i ? { ...q, unitPrice: parseFloat(e.target.value) } : q))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                    />
                  </div>
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Тээвэрлэлтийн зардал ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={shippingCost}
                    onChange={e => setShippingCost(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Тэмдэглэл</label>
                  <input
                    type="text"
                    placeholder="Нэмэлт мэдээлэл..."
                    value={quoteNote}
                    onChange={e => setQuoteNote(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                  />
                </div>
              </div>
              <ActionBtn
                variant="success"
                disabled={acting}
                onClick={() => action('quote', { parts: quoteParts, shippingCost: parseFloat(shippingCost) || 0, note: quoteNote })}
              >
                Үнийн санал илгээх
              </ActionBtn>
            </div>
          </Section>
        )}

        {/* US Staff: эд анги захиалсан гэх */}
        {role === 'us_staff' && order.status === 'prepayment_verified' &&
          order.assignedTo?._id === userData?._id && (
          <Section title="🛒 Эд анги худалдан авах">
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Худалдан авалтын баримт URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={purchaseReceiptUrl}
                  onChange={e => setPurchaseReceiptUrl(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                />
              </div>
              <ActionBtn
                variant="success"
                disabled={acting}
                onClick={() => action('parts-ordered', { purchaseReceiptUrl })}
              >
                Эд анги захиалагдсан гэж тэмдэглэх
              </ActionBtn>
            </div>
          </Section>
        )}

        {/* US Staff: tracking нэмэх */}
        {role === 'us_staff' && order.status === 'parts_ordered' &&
          order.assignedTo?._id === userData?._id && (
          <Section title="✈️ Карго мэдээлэл нэмэх">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Карго компани</label>
                <input
                  type="text"
                  placeholder="DHL, FedEx, Seven Cargo..."
                  value={cargoCompany}
                  onChange={e => setCargoCompany(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Tracking дугаар</label>
                <input
                  type="text"
                  placeholder="1234567890"
                  value={trackingNumber}
                  onChange={e => setTrackingNumber(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                />
              </div>
            </div>
            <ActionBtn
              variant="success"
              disabled={acting}
              onClick={() => action('shipped', { trackingNumber, cargoCompany })}
            >
              Тээвэрлэгдсэн гэж тэмдэглэх
            </ActionBtn>
          </Section>
        )}

        {/* Customer: үнийн санал хариу */}
        {role === 'customer' && order.status === 'quote_sent' && (
          <Section title="💰 Үнийн санал">
            <div className="flex gap-3 mt-2">
              <ActionBtn variant="success" disabled={acting} onClick={() => action('quote-response', { approved: true })}>
                Зөвшөөрөх
              </ActionBtn>
              <div className="flex gap-2 flex-1">
                <input
                  type="text"
                  placeholder="Татгалзах шалтгаан..."
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none"
                />
                <ActionBtn
                  variant="danger"
                  disabled={acting}
                  onClick={() => action('quote-response', { approved: false, rejectionReason })}
                >
                  Татгалзах
                </ActionBtn>
              </div>
            </div>
          </Section>
        )}

        {/* Customer: урьдчилгаа баримт */}
        {role === 'customer' && order.status === 'quote_approved' && (
          <Section title="💳 Урьдчилгаа төлбөр (70%)">
            <p className="text-sm text-gray-500 mb-3">
              Төлөх дүн: <strong>${(order.quote.totalAmount * 0.7).toFixed(2)}</strong>
            </p>
            <div className="flex gap-3">
              <input
                type="url"
                placeholder="Банкны баримтын URL эсвэл зургийн линк..."
                value={prepaymentUrl}
                onChange={e => setPrepaymentUrl(e.target.value)}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
              />
              <ActionBtn disabled={acting} onClick={() => action('prepayment', { receiptUrl: prepaymentUrl })}>
                Хавсаргах
              </ActionBtn>
            </div>
          </Section>
        )}

        {/* Customer: үлдэгдэл төлбөр */}
        {role === 'customer' && order.status === 'delivered' && (
          <Section title="💳 Үлдэгдэл төлбөр (30%)">
            <p className="text-sm text-gray-500 mb-3">
              Төлөх дүн: <strong>${(order.quote.totalAmount * 0.3).toFixed(2)}</strong>
            </p>
            <div className="flex gap-3">
              <input
                type="url"
                placeholder="Банкны баримтын URL эсвэл зургийн линк..."
                value={finalPaymentUrl}
                onChange={e => setFinalPaymentUrl(e.target.value)}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
              />
              <ActionBtn disabled={acting} onClick={() => action('final-payment', { receiptUrl: finalPaymentUrl })}>
                Хавсаргах
              </ActionBtn>
            </div>
          </Section>
        )}

        {/* MN Staff: Монголд ирсэн */}
        {role === 'mn_staff' && order.status === 'shipped' && (
          <Section title="📦 Карго хүлээн авах">
            <ActionBtn variant="success" disabled={acting} onClick={() => action('arrived')}>
              Монголд ирсэн гэж тэмдэглэх
            </ActionBtn>
          </Section>
        )}

        {/* MN Staff: хүргэлт дуусгах */}
        {role === 'mn_staff' && ['arrived', 'out_for_delivery'].includes(order.status) && (
          <Section title="🏠 Хүргэлт дуусгах">
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Хүлээн авагчийн нэр"
                value={recipientName}
                onChange={e => setRecipientName(e.target.value)}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
              />
              <ActionBtn variant="success" disabled={acting} onClick={() => action('deliver', { recipientName })}>
                Хүргэсэн
              </ActionBtn>
            </div>
          </Section>
        )}

        {/* Admin: урьдчилгаа баталгаажуулах */}
        {role === 'admin' && order.status === 'prepayment_uploaded' && (
          <Section title="✅ Урьдчилгаа баталгаажуулах">
            <p className="text-sm text-gray-500 mb-3">
              Баримт: {' '}
              {order.prepayment?.receiptUrl
                ? <a href={order.prepayment.receiptUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">Харах</a>
                : '—'
              }
            </p>
            <ActionBtn variant="success" disabled={acting} onClick={() => action('verify-prepayment')}>
              Урьдчилгаа баталгаажуулах
            </ActionBtn>
          </Section>
        )}

        {/* Admin: үлдэгдэл төлбөр баталгаажуулах */}
        {role === 'admin' && order.finalPayment?.receiptUrl && order.status === 'delivered' && (
          <Section title="✅ Үлдэгдэл төлбөр баталгаажуулах">
            <p className="text-sm text-gray-500 mb-3">
              Баримт: {' '}
              <a href={order.finalPayment.receiptUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">Харах</a>
            </p>
            <ActionBtn variant="success" disabled={acting} onClick={() => action('verify-final-payment')}>
              Захиалга дуусгах
            </ActionBtn>
          </Section>
        )}

        {/* Аудит лог */}
        {order.statusHistory?.length > 0 && (
          <Section title="📋 Түүх">
            <div className="flex flex-col gap-2">
              {[...order.statusHistory].reverse().map((h, i) => {
                const s = STATUS_LABEL[h.status]
                return (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-gray-300 mt-1.5 shrink-0" />
                    <div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${s?.color || 'bg-gray-100 text-gray-600'}`}>
                        {s?.text || h.status}
                      </span>
                      {h.note && <span className="text-gray-500 ml-2">{h.note}</span>}
                      <p className="text-xs text-gray-400 mt-0.5">
                        {h.changedBy?.name} · {new Date(h.changedAt).toLocaleString('mn-MN')}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </Section>
        )}

      </div>
    </div>
  )
}

export default OrderDetail
