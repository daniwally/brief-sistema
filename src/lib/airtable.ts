const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || "";
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || "";
const BASE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`;

// Use table IDs to avoid encoding issues with table names
export const TABLE_IDS = {
  Facturas: "tblc5An5TrhxzyBMU",
  Gastos: "tbl3DdSPn3G71yUDl",
  Categorias: "tblp1nn7PjBjsUbEM",
  Pagos: "tblwkurZVkCOypl8I",
} as const;

export function checkConfig() {
  return {
    hasApiKey: !!AIRTABLE_API_KEY && AIRTABLE_API_KEY !== "",
    hasBaseId: !!AIRTABLE_BASE_ID && AIRTABLE_BASE_ID !== "",
    baseIdPrefix: AIRTABLE_BASE_ID.substring(0, 6),
  };
}

function headers() {
  return {
    Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    "Content-Type": "application/json",
  };
}

export interface ListOptions {
  filterByFormula?: string;
  sort?: { field: string; direction: "asc" | "desc" }[];
  fields?: string[];
  maxRecords?: number;
}

export async function listRecords<T>(
  tableName: string,
  options: ListOptions = {}
): Promise<{ id: string; fields: T }[]> {
  const allRecords: { id: string; fields: T }[] = [];
  let offset: string | undefined;

  do {
    const params = new URLSearchParams();
    if (options.filterByFormula) params.set("filterByFormula", options.filterByFormula);
    if (options.sort) {
      options.sort.forEach((s, i) => {
        params.set(`sort[${i}][field]`, s.field);
        params.set(`sort[${i}][direction]`, s.direction);
      });
    }
    if (options.fields) {
      options.fields.forEach((f) => params.append("fields[]", f));
    }
    if (options.maxRecords) params.set("maxRecords", String(options.maxRecords));
    if (offset) params.set("offset", offset);

    const res = await fetch(`${BASE_URL}/${encodeURIComponent(tableName)}?${params}`, {
      headers: headers(),
      cache: "no-store",
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Airtable error ${res.status}: ${error}`);
    }

    const data = await res.json();
    allRecords.push(...data.records.map((r: { id: string; fields: T }) => ({ id: r.id, fields: r.fields })));
    offset = data.offset;
  } while (offset);

  return allRecords;
}

export async function getRecord<T>(tableName: string, recordId: string): Promise<{ id: string; fields: T }> {
  const res = await fetch(`${BASE_URL}/${encodeURIComponent(tableName)}/${recordId}`, {
    headers: headers(),
    cache: "no-store",
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Airtable error ${res.status}: ${error}`);
  }

  const data = await res.json();
  return { id: data.id, fields: data.fields };
}

export async function createRecord<T>(
  tableName: string,
  fields: Partial<T>
): Promise<{ id: string; fields: T }> {
  const res = await fetch(`${BASE_URL}/${encodeURIComponent(tableName)}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ fields }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Airtable error ${res.status}: ${error}`);
  }

  const data = await res.json();
  return { id: data.id, fields: data.fields };
}

export async function updateRecord<T>(
  tableName: string,
  recordId: string,
  fields: Partial<T>
): Promise<{ id: string; fields: T }> {
  const res = await fetch(`${BASE_URL}/${encodeURIComponent(tableName)}/${recordId}`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify({ fields }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Airtable error ${res.status}: ${error}`);
  }

  const data = await res.json();
  return { id: data.id, fields: data.fields };
}

export async function deleteRecord(tableName: string, recordId: string): Promise<{ id: string; deleted: boolean }> {
  const res = await fetch(`${BASE_URL}/${encodeURIComponent(tableName)}/${recordId}`, {
    method: "DELETE",
    headers: headers(),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Airtable error ${res.status}: ${error}`);
  }

  const data = await res.json();
  return { id: data.id, deleted: data.deleted };
}

export async function uploadAttachment(
  tableName: string,
  recordId: string,
  fieldName: string,
  file: File
): Promise<void> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(
    `${BASE_URL}/${encodeURIComponent(tableName)}/${recordId}/${encodeURIComponent(fieldName)}/uploadAttachment`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
      body: formData,
    }
  );

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Airtable attachment upload error ${res.status}: ${error}`);
  }
}
