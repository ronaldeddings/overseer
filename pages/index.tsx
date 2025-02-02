import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full">
        <h1 className="text-4xl font-bold mb-8">Welcome to Overseer</h1>
        <p className="text-xl mb-8 text-muted-foreground">Your Workflow Automation Platform</p>
        
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Management</CardTitle>
              <CardDescription>Create and manage your automation workflows</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/workflows">
                  Get Started
                  <span className="ml-2">→</span>
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Features</CardTitle>
              <CardDescription>Key capabilities of the platform</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              <div className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                <span>Visual workflow builder with React Flow</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                <span>Browser automation via Chrome Extension</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                <span>API integrations and custom code steps</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                <span>Scheduling and parallel execution</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
} 