import { getWorks, getWorksCount } from "@/lib/db/queries";
import { WorksClient } from "./works-client";

export default async function WorksPage() {
    const [works, totalCount] = await Promise.all([
        getWorks(50),
        getWorksCount()
    ]);

    return (
        <WorksClient initialData={works} totalCount={totalCount} />
    );
}
