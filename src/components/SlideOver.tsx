import { ReactNode } from 'react'
import { 
  Dialog, 
  DialogContent as SlideOverContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from './ui/dialog'

interface SlideOverProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
}

export default function SlideOver({ 
  open, 
  onOpenChange, 
  title, 
  description, 
  children 
}: SlideOverProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SlideOverContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-sm text-muted-foreground">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="px-1">
          {children}
        </div>
      </SlideOverContent>
    </Dialog>
  )
}
