import { getMaterials } from "@/lib/db/queries";
import { MaterialsClient } from "./materials-client";

export default async function MaterialsPage() {
    const materials = await getMaterials(50);

    return (
        <MaterialsClient initialData={materials} />
    );
}

