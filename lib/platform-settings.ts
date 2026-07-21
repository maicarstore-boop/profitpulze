import "server-only";
import { connectToDatabase } from "@/lib/db";
import { PlatformSettingsModel, SETTINGS_SINGLETON_KEY } from "@/models/PlatformSettings";

export async function isMaintenanceMode(): Promise<boolean> {
  await connectToDatabase();
  const settings = await PlatformSettingsModel.findOne({ key: SETTINGS_SINGLETON_KEY }).select("maintenanceMode").lean();
  return settings?.maintenanceMode ?? false;
}
