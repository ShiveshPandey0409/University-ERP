import type { Paginated } from "@erp/shared";

export function skipTake(query: { page: number; pageSize: number }) {
  return { skip: (query.page - 1) * query.pageSize, take: query.pageSize };
}

export function toPaginated<T>(
  data: T[],
  total: number,
  query: { page: number; pageSize: number },
): Paginated<T> {
  return {
    data,
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.ceil(total / query.pageSize),
  };
}
