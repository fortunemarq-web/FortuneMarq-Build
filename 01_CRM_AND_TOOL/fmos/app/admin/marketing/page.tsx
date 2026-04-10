import { createServerClientWithCookies } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import MarketingDashboard from '@/components/admin/marketing/marketing-dashboard'

export default async function MarketingPage() {
    const supabase = await createServerClientWithCookies()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if ((profile as any)?.role !== 'admin') redirect('/login')

    return <MarketingDashboard />
}
