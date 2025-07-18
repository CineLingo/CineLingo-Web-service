import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { InfoIcon } from "lucide-react";
import { FetchDataSteps } from "@/components/tutorial/fetch-data-steps";
import HomeButton from "@/components/home-button";

export default async function ProtectedPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth/login");
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-12">
      <HomeButton variant="floating" />
      <div className="w-full">
        <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm p-3 px-5 rounded-md border border-blue-200 dark:border-blue-700 flex gap-3 items-center">
          <InfoIcon size="16" strokeWidth={2} />
          This is a protected page that you can only see as an authenticated
          user
        </div>
      </div>
      <div className="flex flex-col gap-2 items-start">
        <h2 className="font-bold text-2xl mb-4 text-gray-900 dark:text-gray-100">Your user details</h2>
        <pre className="text-xs font-mono p-3 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 max-h-32 overflow-auto">
          {JSON.stringify(data.user, null, 2)}
        </pre>
      </div>
      <div>
        <h2 className="font-bold text-2xl mb-4 text-gray-900 dark:text-gray-100">Next steps</h2>
        <FetchDataSteps />
      </div>
    </div>
  );
}
