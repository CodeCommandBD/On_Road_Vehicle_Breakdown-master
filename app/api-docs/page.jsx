```javascript
"use client";

import { LazySwaggerUI } from "@/components/lazy";
import { getApiDocs } from "@/lib/swagger";

export default function ApiDoc() {
  return (
    <section className="container mx-auto py-10">
      <LazySwaggerUI spec={getApiDocs()} />
    </section>
  );
}
```;
