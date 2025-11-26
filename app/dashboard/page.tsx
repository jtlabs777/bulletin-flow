import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { FileText, Plus } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    // Get user's church
    const { data: churches, error: churchError } = await supabase
        .from('churches')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle()

    // If no church found, redirect to create church page
    if (!churches) {
        redirect('/dashboard/create-church')
    }

    // Get recent bulletins
    const { data: bulletins } = await supabase
        .from('bulletins')
        .select('*')
        .eq('church_id', churches.id)
        .order('created_at', { ascending: false })
        .limit(5)


    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Welcome back!</h1>
                    <p className="text-gray-600 mt-1">
                        {churches?.name || 'Your Church'}
                    </p>
                </div>
                <Link href="/dashboard/bulletins/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New Bulletin
                    </Button>
                </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Total Bulletins</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{bulletins?.length || 0}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Templates</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">0</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>This Month</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">0</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Bulletins</CardTitle>
                    <CardDescription>
                        Your recently uploaded bulletins
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!bulletins || bulletins.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <FileText className="h-12 w-12 text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                No bulletins yet
                            </h3>
                            <p className="text-gray-600 mb-4">
                                Get started by creating your first bulletin
                            </p>
                            <Link href="/dashboard/bulletins/new">
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Bulletin
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {bulletins.map((bulletin) => (
                                <div
                                    key={bulletin.id}
                                    className="flex items-center justify-between border-b pb-4"
                                >
                                    <div>
                                        <p className="font-medium">
                                            Week of {new Date(bulletin.week_of).toLocaleDateString()}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            Created {new Date(bulletin.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <Link href={`/dashboard/bulletins/${bulletin.id}/edit`}>
                                        <Button variant="outline" size="sm">
                                            View
                                        </Button>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
