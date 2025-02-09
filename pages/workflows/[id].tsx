import { useRouter } from 'next/router'
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WorkflowEditor } from '@/components/workflows/WorkflowEditor'

export default function WorkflowPage() {
  const router = useRouter()
  const { id } = router.query

  if (!id || typeof id !== 'string') {
    return null
  }

  return (
    <div className="h-screen w-screen">
      <WorkflowEditor workflowId={id} />
    </div>
  )
} 