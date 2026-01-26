import { getWorks } from "@/lib/db/queries";
import { WorksClient } from "./works-client";

export default async function WorksPage() {
    const works = await getWorks();

    return (
        <WorksClient initialData={works} />
    );
}
