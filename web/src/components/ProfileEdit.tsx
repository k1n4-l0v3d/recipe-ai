import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { cabinetApi } from '../api/cabinet'

export default function ProfileEdit() {
  const { user } = useAuth()
  const [name, setName] = useState(user?.name ?? '')
  const [nameMsg, setNameMsg] = useState('')
  const [nameError, setNameError] = useState('')
  const [nameSaving, setNameSaving] = useState(false)

  const [curPwd, setCurPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [repPwd, setRepPwd] = useState('')
  const [pwdMsg, setPwdMsg] = useState('')
  const [pwdError, setPwdError] = useState('')
  const [pwdSaving, setPwdSaving] = useState(false)

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 8,
    background: 'var(--bg)', border: '1px solid var(--border-2)',
    color: 'var(--text)', fontSize: 14, outline: 'none',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: 11, color: 'var(--text-3)', letterSpacing: 1,
    textTransform: 'uppercase', display: 'block', marginBottom: 4,
  }

  const saveName = async (e: React.FormEvent) => {
    e.preventDefault()
    setNameError(''); setNameMsg(''); setNameSaving(true)
    try {
      await cabinetApi.updateName(name.trim())
      setNameMsg('Имя сохранено ✓')
    } catch (err) {
      setNameError((err as Error).message)
    } finally {
      setNameSaving(false)
    }
  }

  const savePwd = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwdError(''); setPwdMsg('')
    if (newPwd !== repPwd) { setPwdError('Пароли не совпадают'); return }
    if (newPwd.length < 8) { setPwdError('Минимум 8 символов'); return }
    setPwdSaving(true)
    try {
      await cabinetApi.updatePassword(curPwd, newPwd)
      setPwdMsg('Пароль изменён ✓')
      setCurPwd(''); setNewPwd(''); setRepPwd('')
    } catch (err) {
      setPwdError((err as Error).message)
    } finally {
      setPwdSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'linear-gradient(135deg,#ff6b35,#ff4500)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, fontWeight: 700, color: '#fff',
        }}>
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-heading)' }}>{user?.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{user?.email}</div>
        </div>
      </div>

      <form onSubmit={saveName} style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>Основные данные</div>
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Имя</label>
          <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} required />
        </div>
        {nameError && <div style={{ fontSize: 12, color: '#ef4444', marginBottom: 8 }}>{nameError}</div>}
        {nameMsg && <div style={{ fontSize: 12, color: '#22c55e', marginBottom: 8 }}>{nameMsg}</div>}
        <button type="submit" disabled={nameSaving} style={{
          background: 'var(--accent)', color: '#fff', border: 'none',
          borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600,
          cursor: nameSaving ? 'not-allowed' : 'pointer', minHeight: 44,
        }}>
          {nameSaving ? 'Сохраняю...' : 'Сохранить'}
        </button>
      </form>

      <form onSubmit={savePwd} style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>Смена пароля</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={labelStyle}>Текущий пароль</label>
            <input type="password" value={curPwd} onChange={e => setCurPwd(e.target.value)} style={inputStyle} required />
          </div>
          <div>
            <label style={labelStyle}>Новый пароль</label>
            <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="Минимум 8 символов" style={inputStyle} required />
          </div>
          <div>
            <label style={labelStyle}>Повтор нового пароля</label>
            <input type="password" value={repPwd} onChange={e => setRepPwd(e.target.value)} style={inputStyle} required />
          </div>
        </div>
        {pwdError && <div style={{ fontSize: 12, color: '#ef4444', marginTop: 8 }}>{pwdError}</div>}
        {pwdMsg && <div style={{ fontSize: 12, color: '#22c55e', marginTop: 8 }}>{pwdMsg}</div>}
        <button type="submit" disabled={pwdSaving} style={{
          background: 'var(--bg-3)', color: 'var(--text-2)', border: '1px solid var(--border-2)',
          borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600,
          cursor: pwdSaving ? 'not-allowed' : 'pointer', marginTop: 16, minHeight: 44,
        }}>
          {pwdSaving ? 'Сохраняю...' : 'Сменить пароль'}
        </button>
      </form>
    </div>
  )
}
