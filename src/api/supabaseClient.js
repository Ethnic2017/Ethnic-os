import { supabase } from '@/lib/supabase';

// Entity name → Supabase table name
const TABLE_MAP = {
  People: 'people',
  Company: 'companies',
  Project: 'projects',
  Event: 'events',
  Task: 'tasks',
  Product: 'products',
  Order: 'orders',
  CommunityMember: 'community_members',
  ContentItem: 'content_items',
  MediaItem: 'media_items',
  ModulePermissions: 'module_permissions',
  DecoItem: 'deco_items',
  Contact: 'contacts',
  ComPost: 'com_posts',
};

// Parse "-field" → { column: "field", ascending: false }
const parseOrderBy = (orderBy) => {
  if (!orderBy) return { column: 'created_date', ascending: false };
  const desc = orderBy.startsWith('-');
  return { column: desc ? orderBy.slice(1) : orderBy, ascending: !desc };
};

// PostgREST plafonne chaque requête à 1000 lignes. fetchPaged boucle en
// pages de 1000 via .range() pour récupérer jusqu'à `limit` lignes (toutes si limit grand).
const PAGE = 1000;
const fetchPaged = async (makeQuery, start = 0, limit = 200) => {
  const want = limit && limit > 0 ? limit : Infinity;
  let all = [];
  let offset = start;
  while (all.length < want) {
    const batch = Math.min(PAGE, want - all.length);
    // tri secondaire par id : garantit une pagination stable même si la
    // colonne de tri principale a des valeurs identiques (sinon doublons/oublis)
    const { data, error } = await makeQuery()
      .order('id', { ascending: true })
      .range(offset, offset + batch - 1);
    if (error) throw error;
    all = all.concat(data || []);
    if (!data || data.length < batch) break; // plus de lignes
    offset += batch;
  }
  return all;
};

const createEntityProxy = (entityName) => {
  const table = TABLE_MAP[entityName];
  if (!table) throw new Error(`Unknown entity: ${entityName}`);

  return {
    // list(orderBy, limit, skip?)
    async list(orderBy = '-created_date', limit = 200, skip = 0) {
      const { column, ascending } = parseOrderBy(orderBy);
      const makeQuery = () => supabase.from(table).select('*').order(column, { ascending });
      return await fetchPaged(makeQuery, skip || 0, limit);
    },

    // filter(filterObj, orderBy?, limit?)
    async filter(filterObj = {}, orderBy = '-created_date', limit = 200) {
      const { column, ascending } = parseOrderBy(orderBy);
      const makeQuery = () => {
        let q = supabase.from(table).select('*');
        for (const [key, value] of Object.entries(filterObj)) {
          q = Array.isArray(value) ? q.in(key, value) : q.eq(key, value);
        }
        return q.order(column, { ascending });
      };
      return await fetchPaged(makeQuery, 0, limit);
    },

    // count(filterObj?) — renvoie le nombre total sans charger les lignes
    async count(filterObj = {}) {
      let query = supabase.from(table).select('*', { count: 'exact', head: true });
      for (const [key, value] of Object.entries(filterObj)) {
        query = Array.isArray(value) ? query.in(key, value) : query.eq(key, value);
      }
      const { count, error } = await query;
      if (error) throw error;
      return count ?? 0;
    },

    // create(data)
    async create(data) {
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },

    // update(id, data)
    async update(id, data) {
      const { data: result, error } = await supabase
        .from(table)
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },

    // delete(id)
    async delete(id) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    },
  };
};

// Build entities proxy for all known entities
const entities = new Proxy({}, {
  get(_, entityName) {
    return createEntityProxy(entityName);
  }
});

// File upload — replaces base44.integrations.Core.UploadFile({ file })
const uploadFile = async ({ file }) => {
  const ext = file.name.split('.').pop();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const bucket = file.type?.startsWith('image/') ? 'media' : 'media';

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { file_url: data.publicUrl };
};

// Auth helpers
const auth = {
  async me() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw error ?? new Error('Not authenticated');

    // Get role from module_permissions
    const { data: perms } = await supabase
      .from('module_permissions')
      .select('account_type')
      .eq('user_email', user.email)
      .single();

    const role = perms?.account_type === 'admin' ? 'admin' : 'user';

    return {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.email,
      role,
    };
  },

  async logout(redirectUrl) {
    await supabase.auth.signOut();
    window.location.href = redirectUrl ?? '/login';
  },

  redirectToLogin(redirectUrl) {
    const from = redirectUrl ? `?from=${encodeURIComponent(redirectUrl)}` : '';
    window.location.href = `/login${from}`;
  },

  async updateMe(data) {
    const { error } = await supabase.auth.updateUser({
      data: { full_name: data.full_name, ...data },
    });
    if (error) throw error;
  },
};

// Edge functions — replaces base44.functions.invoke(name, payload)
const functions = {
  async invoke(functionName, payload = {}) {
    const { data, error } = await supabase.functions.invoke(functionName, { body: payload });
    if (error) throw error;
    return { data };
  },
};

// Drop-in replacement for base44 object
export const base44Compat = {
  entities,
  integrations: {
    Core: {
      UploadFile: uploadFile,
    },
  },
  auth,
  functions,
};
