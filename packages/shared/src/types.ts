export type ID = string;
export type ISO8601Timestamp = string;

export interface BaseEntityProps {
  id: ID;
  createdAt: ISO8601Timestamp;
  updatedAt: ISO8601Timestamp;
}
