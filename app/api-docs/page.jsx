import { getApiDocs } from "@/lib/swagger";
import SwaggerUIClient from "@/components/swagger/SwaggerUIClient";

export default async function ApiDoc() {
  const spec = await getApiDocs();

  return <SwaggerUIClient spec={spec} />;
}
