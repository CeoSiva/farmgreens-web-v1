import { SettingsClient } from "@/components/settings/settings-client"
import { getSettings } from "@/lib/data/setting"
import { getSystemSetting } from "@/lib/data/system-setting"
import { listDistricts } from "@/lib/data/location"

export const dynamic = "force-dynamic"

export default async function SettingsPage() {
  const [settings, districts, bannerMessage] = await Promise.all([
    getSettings(),
    listDistricts(),
    getSystemSetting("delivery_banner_message"),
  ])

  const plainSettings = JSON.parse(JSON.stringify(settings))
  const plainDistricts = JSON.parse(JSON.stringify(districts))

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage store profile, delivery fee, and service locations.
        </p>
      </div>

      <SettingsClient 
        settings={plainSettings} 
        districts={plainDistricts} 
        bannerMessage={bannerMessage}
      />
    </div>
  )
}
