import { getMaterials, getMaterialsCount } from "@/lib/db/queries";
import { MaterialsClient } from "./materials-client";

export default async function MaterialsPage() {
    const [materials, totalCount] = await Promise.all([
        getMaterials(50),
        getMaterialsCount()
    ]);

    return (
        <MaterialsClient initialData={materials} totalCount={totalCount} />
    );
}

