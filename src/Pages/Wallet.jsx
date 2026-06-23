import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { Coins, ArrowDownLeft, ArrowUpRight, Clock, CheckCircle, XCircle, Send, Copy } from 'lucide-react'
import toast from 'react-hot-toast'

const BG = '#060d1a'

function TxIcon({ type }) {
  if (type === 'topup' || type === 'starter') return <ArrowDownLeft size={14} className="text-green-500" />
  if (type === 'transfer_in') return <ArrowDownLeft size={14} className="text-blue-500" />
  if (type === 'transfer_out') return <ArrowUpRight size={14} className="text-orange-500" />
  return <ArrowUpRight size={14} className="text-red-500" />
}

function TxBadge({ type }) {
  const map = {
    topup:        { label: 'Top-up',   bg: 'bg-green-100 text-green-700' },
    starter:      { label: 'Starter',  bg: 'bg-amber-100 text-amber-700' },
    transfer_in:  { label: 'Received', bg: 'bg-blue-100 text-blue-700' },
    transfer_out: { label: 'Sent',     bg: 'bg-orange-100 text-orange-700' },
    spend:        { label: 'Spent',    bg: 'bg-red-100 text-red-700' },
  }
  const { label, bg } = map[type] || { label: type, bg: 'bg-gray-100 text-gray-600' }
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${bg}`}>{label}</span>
}

export default function Wallet() {
  const { user } = useAuth()
  const isAdmin = user?.isStaffAdmin || user?.isStudentAdmin || user?.accountType === 'staff'

  const [tab, setTab] = useState('wallet')  // 'wallet' | 'topup' | 'transfer' | 'requests'
  const [wallet, setWallet] = useState(null)
  const [bankInfo, setBankInfo] = useState(null)
  const [loading, setLoading] = useState(true)

  // Top-up form
  const [selectedPkg, setSelectedPkg] = useState(null)
  const [topupNote, setTopupNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Transfer form
  const [transferTo, setTransferTo] = useState('')
  const [transferAmt, setTransferAmt] = useState('')
  const [transferNote, setTransferNote] = useState('')
  const [transferring, setTransferring] = useState(false)

  // Admin: credit requests
  const [requests, setRequests] = useState([])
  const [reqTab, setReqTab] = useState('pending')
  const [rejectNote, setRejectNote] = useState({})
  const [actionLoading, setActionLoading] = useState({})

  useEffect(() => {
    Promise.all([
      axios.get('/api/credits/wallet'),
      axios.get('/api/credits/bank-info'),
    ]).then(([w, b]) => {
      setWallet(w.data)
      setBankInfo(b.data)
    }).catch(() => toast.error('Failed to load wallet'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (tab === 'requests' && isAdmin) loadRequests()
  }, [tab, reqTab])

  const loadRequests = async () => {
    try {
      const { data } = await axios.get(`/api/credits/requests?status=${reqTab}`)
      setRequests(data.requests)
    } catch { toast.error('Failed to load requests') }
  }

  const handleTopupSubmit = async () => {
    if (!selectedPkg) return toast.error('Select a package first')
    if (!bankInfo?.bankAccountNumber) return toast.error('Admin has not set up payment details yet')
    if (wallet?.pendingRequest) return toast.error('You already have a pending request')
    setSubmitting(true)
    try {
      await axios.post('/api/credits/request', { naira: selectedPkg.naira, note: topupNote })
      toast.success('Request submitted! Admin will review and approve shortly.')
      const w = await axios.get('/api/credits/wallet')
      setWallet(w.data)
      setSelectedPkg(null)
      setTopupNote('')
      setTab('wallet')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit request')
    } finally {
      setSubmitting(false)
    }
  }

  const handleTransfer = async () => {
    const amt = parseInt(transferAmt)
    if (!transferTo.trim() || !amt || amt < 1) return toast.error('Fill in recipient and amount')
    setTransferring(true)
    try {
      const { data } = await axios.post('/api/credits/transfer', { toUsername: transferTo, amount: amt, note: transferNote })
      toast.success(`${amt} credit${amt !== 1 ? 's' : ''} sent to ${data.recipient}!`)
      const w = await axios.get('/api/credits/wallet')
      setWallet(w.data)
      setTransferTo('')
      setTransferAmt('')
      setTransferNote('')
      setTab('wallet')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Transfer failed')
    } finally {
      setTransferring(false)
    }
  }

  const handleApprove = async (id) => {
    setActionLoading(p => ({ ...p, [id]: true }))
    try {
      await axios.patch(`/api/credits/requests/${id}/approve`)
      toast.success('Credits approved and sent to student!')
      loadRequests()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve')
    } finally {
      setActionLoading(p => ({ ...p, [id]: false }))
    }
  }

  const handleReject = async (id) => {
    setActionLoading(p => ({ ...p, [id]: true }))
    try {
      await axios.patch(`/api/credits/requests/${id}/reject`, { adminNote: rejectNote[id] || '' })
      toast.success('Request rejected')
      loadRequests()
    } catch {
      toast.error('Failed to reject')
    } finally {
      setActionLoading(p => ({ ...p, [id]: false }))
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const balance = wallet?.credits ?? user?.credits ?? 0
  const packages = bankInfo?.creditPackages || []

  return (
    <div className="max-w-lg mx-auto">

      {/* Balance card */}
      <div className="rounded-2xl p-6 mb-5 text-white relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${BG} 0%, #0d2137 50%, #1a3c5e 100%)` }}>
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #fbbf24, transparent)' }} />
        <p className="text-blue-300 text-xs mb-1 font-medium">Credit Balance</p>
        <div className="flex items-end gap-3">
          <p className="text-5xl font-bold text-amber-400">{balance.toLocaleString()}</p>
          <p className="text-blue-300 text-sm pb-1">credits</p>
        </div>
        <p className="text-blue-400 text-xs mt-1">{user?.fullName}</p>

        {wallet?.pendingRequest && (
          <div className="mt-3 flex items-center gap-2 bg-amber-400/10 border border-amber-400/20 rounded-xl px-3 py-2">
            <Clock size={13} className="text-amber-400 flex-shrink-0" />
            <p className="text-amber-300 text-xs">Top-up request pending — waiting for admin approval</p>
          </div>
        )}
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-5">
        {[
          { key: 'wallet', label: 'History' },
          { key: 'topup', label: 'Top Up' },
          { key: 'transfer', label: 'Transfer' },
          ...(isAdmin ? [{ key: 'requests', label: 'Requests' }] : []),
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${tab === t.key ? 'bg-white text-[#1a3c5e] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Wallet History ── */}
      {tab === 'wallet' && (
        <div>
          {!wallet?.transactions?.length ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center shadow-sm">
              <Coins size={36} className="mx-auto text-gray-200 mb-2" />
              <p className="text-gray-400 text-sm">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {wallet.transactions.map(tx => (
                <div key={tx._id} className="bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                    <TxIcon type={tx.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <TxBadge type={tx.type} />
                      {tx.peer && <p className="text-gray-400 text-[10px] truncate">{tx.peer.fullName}</p>}
                    </div>
                    <p className="text-gray-500 text-xs truncate">{tx.note}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`font-bold text-sm ${tx.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount}
                    </p>
                    <p className="text-gray-400 text-[10px]">bal: {tx.balance}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Top Up ── */}
      {tab === 'topup' && (
        <div className="space-y-4">
          {!bankInfo?.bankAccountNumber ? (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center">
              <p className="text-amber-700 font-semibold text-sm">Payment not configured yet</p>
              <p className="text-amber-600 text-xs mt-1">Admin needs to add the bank account details first.</p>
            </div>
          ) : (
            <>
              {/* Bank account card */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Pay to this account</p>
                <p className="text-lg font-bold text-[#1a3c5e]">{bankInfo.bankAccountNumber}
                  <button onClick={() => { navigator.clipboard.writeText(bankInfo.bankAccountNumber); toast.success('Copied!') }}
                    className="ml-2 text-gray-400 hover:text-[#1a3c5e]">
                    <Copy size={14} className="inline" />
                  </button>
                </p>
                <p className="text-gray-600 text-sm font-medium">{bankInfo.bankAccountName}</p>
                <p className="text-gray-400 text-xs">{bankInfo.bankName}</p>
              </div>

              {/* Package selection */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Select a package</p>
                <div className="grid grid-cols-2 gap-2">
                  {packages.map(pkg => (
                    <button key={pkg.naira} onClick={() => setSelectedPkg(pkg)}
                      className={`p-4 rounded-xl border text-left transition ${
                        selectedPkg?.naira === pkg.naira
                          ? 'border-amber-400 bg-amber-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}>
                      <p className="text-[10px] text-gray-400 font-semibold uppercase">{pkg.label}</p>
                      <p className="text-xl font-bold text-[#1a3c5e]">₦{pkg.naira.toLocaleString()}</p>
                      <p className="text-amber-600 text-sm font-bold">{pkg.credits} credits</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Note to admin (optional)</label>
                <input value={topupNote} onChange={e => setTopupNote(e.target.value)}
                  placeholder='e.g. "Paid via GTBank transfer at 2pm"'
                  style={{ fontSize: 14 }}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-600">
                After paying, click <strong>Submit Request</strong>. Admin will confirm the payment and credit your wallet.
              </div>

              <button onClick={handleTopupSubmit} disabled={!selectedPkg || submitting || !!wallet?.pendingRequest}
                className="w-full bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-[#1a3c5e] font-bold py-3 rounded-xl transition">
                {submitting ? 'Submitting…' : wallet?.pendingRequest ? 'Request Already Pending' : selectedPkg ? `I've paid ₦${selectedPkg.naira} — Submit Request` : 'Select a package first'}
              </button>
            </>
          )}
        </div>
      )}

      {/* ── Transfer ── */}
      {tab === 'transfer' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Recipient (full name or email)</label>
            <input value={transferTo} onChange={e => setTransferTo(e.target.value)}
              placeholder="e.g. Tunde Adewale"
              style={{ fontSize: 14 }}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Amount (credits)</label>
            <input type="number" value={transferAmt} onChange={e => setTransferAmt(e.target.value)}
              min={1} max={balance} placeholder="e.g. 20"
              style={{ fontSize: 14 }}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]" />
            <p className="text-gray-400 text-xs mt-1">Your balance: {balance} credits</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Message (optional)</label>
            <input value={transferNote} onChange={e => setTransferNote(e.target.value)}
              placeholder='e.g. "for the CBT notes you shared"'
              style={{ fontSize: 14 }}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]" />
          </div>
          <button onClick={handleTransfer} disabled={transferring}
            className="w-full flex items-center justify-center gap-2 bg-[#1a3c5e] hover:bg-[#162f4a] disabled:opacity-50 text-white font-bold py-3 rounded-xl transition">
            <Send size={15} />
            {transferring ? 'Sending…' : 'Send Credits'}
          </button>
        </div>
      )}

      {/* ── Admin: Requests ── */}
      {tab === 'requests' && isAdmin && (
        <div>
          <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-4">
            {['pending', 'approved', 'rejected', 'all'].map(s => (
              <button key={s} onClick={() => setReqTab(s)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${reqTab === s ? 'bg-white text-[#1a3c5e] shadow-sm' : 'text-gray-500'}`}>
                {s}
              </button>
            ))}
          </div>

          {requests.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center shadow-sm">
              <p className="text-gray-400 text-sm">No {reqTab} requests</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map(req => (
                <div key={req._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0">
                      {req.user?.avatar
                        ? <img src={req.user.avatar} className="w-full h-full object-cover" alt="" />
                        : <div className="w-full h-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-[#1a3c5e] font-bold text-sm">
                            {req.user?.fullName?.charAt(0)}
                          </div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-[#1a3c5e] truncate">{req.user?.fullName}</p>
                      <p className="text-gray-400 text-xs capitalize">{req.user?.level}L · {req.user?.accountType}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#1a3c5e]">₦{req.naira.toLocaleString()}</p>
                      <p className="text-amber-600 text-xs font-bold">→ {req.credits} credits</p>
                    </div>
                  </div>

                  {req.note && <p className="text-gray-500 text-xs mb-3 bg-gray-50 rounded-lg px-2.5 py-1.5">"{req.note}"</p>}

                  <p className="text-gray-400 text-[10px] mb-3">
                    {new Date(req.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>

                  {req.status === 'pending' ? (
                    <div className="space-y-2">
                      <input
                        placeholder="Rejection reason (optional)"
                        value={rejectNote[req._id] || ''}
                        onChange={e => setRejectNote(p => ({ ...p, [req._id]: e.target.value }))}
                        style={{ fontSize: 13 }}
                        className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-300"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => handleApprove(req._id)} disabled={actionLoading[req._id]}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-2 rounded-lg transition disabled:opacity-50">
                          <CheckCircle size={13} />
                          {actionLoading[req._id] ? 'Processing…' : 'Approve'}
                        </button>
                        <button onClick={() => handleReject(req._id)} disabled={actionLoading[req._id]}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-red-100 hover:bg-red-200 text-red-600 text-xs font-bold py-2 rounded-lg transition disabled:opacity-50">
                          <XCircle size={13} />
                          Reject
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={`flex items-center gap-1.5 text-xs font-semibold ${req.status === 'approved' ? 'text-green-600' : 'text-red-500'}`}>
                      {req.status === 'approved' ? <CheckCircle size={13} /> : <XCircle size={13} />}
                      {req.status === 'approved' ? 'Approved' : `Rejected${req.adminNote ? `: ${req.adminNote}` : ''}`}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
