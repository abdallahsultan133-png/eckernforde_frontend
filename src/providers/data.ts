import {createDataProvider, CreateDataProviderOptions} from "@refinedev/rest";
import {BACKEND_BASE_URL} from "@/constants";
import {CreateResponse, GetOneResponse, ListResponse} from "@/types";
import {HttpError} from "@refinedev/core";

// The public website must be able to render without the private API being
// configured (for example in a content-preview deployment).  Portal routes
// still make authenticated API requests and therefore need this value, but a
// missing value must not white-screen the public marketing site at import time.
const apiBaseUrl = BACKEND_BASE_URL ?? "";
if (!BACKEND_BASE_URL && import.meta.env.DEV) {
  console.warn("VITE_BACKEND_BASE_URL is not configured. Public pages are available; portal data requires the API URL.");
}

const buildHttpError = async (response: Response): Promise<HttpError> => {
  let message = 'Request failed.';
  try {
    const payload = (await response.json()) as { message?: string }
    if(payload?.message) message = payload.message;
  } catch {
    // Ignore errors
  }
  return { message, statusCode: response.status }
}

const options: CreateDataProviderOptions = {
  getList: {
    getEndpoint: ({ resource }) => {
      // Map virtual resources to their actual endpoints
      if (resource === 'teachers') return 'users/teachers';
      return resource;
    },

    buildQueryParams: async ({ resource, pagination, filters }) => {
      const page = pagination?.currentPage ?? 1;
      const pageSize = pagination?.pageSize ?? 10;
      const params: Record<string, string|number> = { page, limit: pageSize };

      filters?.forEach((filter) => {
        const field = 'field' in filter ? filter.field : '';
        const value = String(filter.value);

        if(resource === 'subjects') {
          if(field === 'department') params.department = value;
          if(field === 'name' || field === 'code') params.search = value;
        }
        if(resource === 'classes') {
          if(field === 'name') params.search = value;
          if(field === 'subject') params.subject = value;
          if(field === 'teacher') params.teacher = value;
        }
        if(resource === 'users') {
          if(field === 'role') params.role = value;
          if(field === 'search') params.search = value;
        }
      })
      return params;
    },

    mapResponse: async (response) => {
      if(!response.ok) throw await buildHttpError(response);
      const payload: ListResponse = await response.clone().json()
      return payload.data ?? [];
    },

    getTotalCount: async (response) => {
      if(!response.ok) throw await buildHttpError(response);
      const payload: ListResponse = await response.clone().json()
      return payload.pagination?.total ?? payload.data?.length ?? 0;
    }
  },

  create: {
    getEndpoint: ({ resource }) => resource,
    buildBodyParams: async ({ variables}) => variables,
    mapResponse: async (response) => {
      const json: CreateResponse = await response.json();
      return json.data ?? [];
    }
  },

  getOne: {
    getEndpoint: ({ resource, id}) => `${resource}/${id}`,
    mapResponse: async (response) => {
      const json: GetOneResponse = await response.json();
      return json.data ?? [];
    }
  },

  // Backend update routes are PUT and respond with { data: T } — override the
  // library defaults (PATCH + raw json body) to match.
  update: {
    getRequestMethod: () => 'put',
    mapResponse: async (response) => {
      const json: GetOneResponse = await response.json();
      return json.data ?? [];
    }
  }
}

// credentials: 'include' passed as ky options so the Better Auth session cookie
// is sent with every Refine useList / useOne call. Without this every request
// hits requireAuth() → 401 → Refine shows empty data silently.
const { dataProvider } = createDataProvider(apiBaseUrl, options, {
  credentials: 'include',
});

export { dataProvider };
