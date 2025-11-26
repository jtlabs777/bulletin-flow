'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function CreateChurchForm() {
    const router = useRouter()
    const [churchName, setChurchName] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!churchName.trim()) {
            setError('Church name is required')
            return
        }

        setLoading(true)

        try {
            const supabase = createClient()

            // Get current user
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                setError('Not authenticated')
                return
            }

            // Create church record
            const { error: churchError } = await supabase
                .from('churches')
                .insert({
                    name: churchName.trim(),
                    owner_id: user.id,
                })

            if (churchError) throw churchError

            // Redirect to dashboard
            router.push('/dashboard')
            router.refresh()
        } catch (err) {
            console.error('Create church error:', err)
            setError(err instanceof Error ? err.message : 'Failed to create church')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                    {error}
                </div>
            )}
            <div className="space-y-2">
                <Label htmlFor="churchName">Church Name</Label>
                <Input
                    id="churchName"
                    type="text"
                    placeholder="First Baptist Church"
                    value={churchName}
                    onChange={(e) => setChurchName(e.target.value)}
                    required
                    disabled={loading}
                />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating...' : 'Create Church'}
            </Button>
        </form>
    )
}
