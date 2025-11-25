import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import UploadZone from '@/components/bulletin/upload-zone'

export default function NewBulletinPage() {
    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">New Bulletin</h1>
                <p className="text-gray-600 mt-2">
                    Upload a bulletin PDF to get started
                </p>
            </div>

            <UploadZone />
        </div>
    )
}
