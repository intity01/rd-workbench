import { useNavigate } from 'react-router'
import { Button, LogoMark } from '../../ui'

export function NotFound() {
  const nav = useNavigate()
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <LogoMark size={48} />
      <h1 className="text-[20px] font-semibold">Screen not found</h1>
      <Button variant="primary" onClick={() => nav('/')}>
        Go Home
      </Button>
    </div>
  )
}
