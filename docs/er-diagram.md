# Entity Relationship Diagram

```mermaid
erDiagram
    users {
        uuid id PK
        string email UK
        string full_name
        string password_hash
        string oauth_provider
        string oauth_provider_id
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    folders {
        uuid id PK
        uuid owner_id FK
        uuid parent_id FK
        string name
        boolean is_deleted
        timestamptz deleted_at
        timestamptz created_at
        timestamptz updated_at
    }

    files {
        uuid id PK
        uuid owner_id FK
        uuid folder_id FK
        string name
        string mime_type
        bigint size_bytes
        string storage_provider
        string storage_bucket
        string storage_key
        string checksum
        boolean is_deleted
        timestamptz deleted_at
        timestamptz created_at
        timestamptz updated_at
    }

    file_versions {
        uuid id PK
        uuid file_id FK
        int version_number
        string storage_key
        bigint size_bytes
        string checksum
        uuid created_by FK
        timestamptz created_at
    }

    shares {
        uuid id PK
        uuid owner_id FK
        uuid shared_with_user_id FK
        uuid file_id FK
        uuid folder_id FK
        string role
        timestamptz created_at
        timestamptz updated_at
    }

    link_shares {
        uuid id PK
        uuid created_by FK
        uuid file_id FK
        uuid folder_id FK
        string token_hash
        string password_hash
        string role
        timestamptz expires_at
        boolean is_active
        timestamptz created_at
    }

    stars {
        uuid id PK
        uuid user_id FK
        uuid file_id FK
        uuid folder_id FK
        timestamptz created_at
    }

    activities {
        uuid id PK
        uuid actor_id FK
        uuid file_id FK
        uuid folder_id FK
        string action
        jsonb metadata
        timestamptz created_at
    }

    users ||--o{ folders : owns
    users ||--o{ files : owns
    folders ||--o{ folders : contains
    folders ||--o{ files : contains
    files ||--o{ file_versions : has
    users ||--o{ file_versions : creates
    users ||--o{ shares : grants
    users ||--o{ shares : receives
    files ||--o{ shares : shared_as_file
    folders ||--o{ shares : shared_as_folder
    users ||--o{ link_shares : creates
    files ||--o{ link_shares : linked_as_file
    folders ||--o{ link_shares : linked_as_folder
    users ||--o{ stars : marks
    files ||--o{ stars : starred_file
    folders ||--o{ stars : starred_folder
    users ||--o{ activities : performs
    files ||--o{ activities : file_activity
    folders ||--o{ activities : folder_activity
```

## Relationship Notes

- A folder can contain child folders and files through `parent_id` and `folder_id`.
- A share points to either a file or a folder.
- A public link points to either a file or a folder.
- A star points to either a file or a folder.
- Soft delete is represented by `is_deleted` and `deleted_at`.
- `file_versions` is included in the schema because the PDF lists it as a core table, but version UI can remain optional until Phase 2.

