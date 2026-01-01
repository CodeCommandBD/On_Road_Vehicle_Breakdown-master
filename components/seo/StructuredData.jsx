/**
 * Structured Data Component
 * Renders JSON-LD schema for SEO
 */

export default function StructuredData({ schema }) {
  if (!schema) return null;

  // Handle array of schemas
  const schemaArray = Array.isArray(schema) ? schema : [schema];

  return (
    <>
      {schemaArray.map((schemaItem, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schemaItem),
          }}
        />
      ))}
    </>
  );
}
