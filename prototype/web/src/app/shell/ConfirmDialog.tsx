import { useStore } from '../state/StoreProvider'
import { Button, Modal } from '../ui'

export function ConfirmDialog() {
  const { confirmReq, setConfirmReq } = useStore()
  if (!confirmReq) return null
  const close = () => setConfirmReq(null)
  const footer = (
    <>
      <Button variant="ghost" onClick={close} autoFocus>
        Cancel
      </Button>
      <Button
        variant="danger"
        onClick={() => {
          confirmReq.onConfirm()
          close()
        }}
      >
        {confirmReq.confirmLabel ?? 'Delete'}
      </Button>
    </>
  )
  return (
    <Modal open onClose={close} title={confirmReq.title} width={420} footer={footer}>
      <p className="text-[13px] leading-relaxed text-muted">{confirmReq.body}</p>
    </Modal>
  )
}
