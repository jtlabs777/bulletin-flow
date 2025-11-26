import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import CreateChurchForm from '@/components/church/create-church-form'

export default async function CreateChurchPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Check if user already has a church
    const { data: existingChurch } = await supabase
        .from('churches')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle()

    if (existingChurch) {
        redirect('/dashboard')
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold">Create Your Church</CardTitle>
                    <CardDescription>
                        Let's set up your church organization
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <CreateChurchForm />
                </CardContent>
            </Card>
        </div>
    )
}
