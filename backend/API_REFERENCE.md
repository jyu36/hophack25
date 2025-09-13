# Research Assistant API Reference

## Base URL

```
http://127.0.0.1:8000
```

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "detail": {
    "error": "Short error description",
    "message": "Detailed explanation of what went wrong",
    "action_required": "What action should be taken to fix the error"
  }
}
```

Common error scenarios:

- 400: Bad Request (invalid input data)
- 404: Resource not found
- 422: Validation error (missing/invalid fields)
- 500: Server error

## Experiment Nodes

### Create Node

```http
POST /nodes

Request Body:
{
    "title": "PCR Optimization",              # Required
    "description": "Optimizing PCR...",       # Optional
    "motivation": "Improve efficiency...",     # Optional
    "expectations": "Find optimal...",         # Optional
    "status": "planned"                       # Optional, defaults to "planned"
}

Success Response (200):
{
    "id": 1,
    "title": "PCR Optimization",
    "description": "Optimizing PCR conditions for DNA amplification",
    "motivation": "Improve amplification efficiency",
    "expectations": "Find optimal temperature and primer conditions",
    "status": "planned",
    "hypothesis": null,
    "result": null,
    "extra_data": null,
    "created_at": "2025-09-13T04:57:49",
    "updated_at": "2025-09-13T04:57:49"
}

Error Response (422):
{
    "detail": {
        "error": "Missing required field",
        "message": "Title is required",
        "action_required": "Please provide a title for the experiment"
    }
}
```

### Get Node Info

```http
GET /nodes/{node_id}?with_parents=true&with_children=true

Success Response (200):
{
    "node": {
        "id": 2,
        "title": "DNA Sequencing",
        "description": "Sequencing amplified DNA samples",
        "status": "planned",
        "type": "experiment",
        ...
    },
    "parents": [
        {
            "id": 1,
            "title": "PCR Optimization",
            "description": "Optimizing PCR conditions...",
            "relationship": "leads_to"
        }
    ],
    "children": []
}

Error Response (404):
{
    "detail": {
        "error": "Node not found",
        "message": "No node exists with ID {node_id}",
        "action_required": "Please verify the node ID"
    }
}
```

### Get All Nodes

```http
GET /nodes?concise=true

Success Response (200):
[
    {
        "id": 1,
        "title": "PCR Optimization",
        "display_text": "Optimizing PCR conditions...",
        "status": "planned",
        "type": "experiment"
    },
    ...
]
```

### Update Node

```http
PATCH /nodes/{node_id}

Request Body:
{
    "title": "Updated Title",            # Optional
    "description": "Updated desc",       # Optional
    "extra_data": {                      # Optional
        "node_type": "experiment",
        "completion_status": "done"
    }
}

Success Response (200):
{
    "id": 1,
    "title": "Updated Title",
    ...
}

Error Response (404):
{
    "detail": {
        "error": "Node not found",
        "message": "No node exists with ID {node_id}",
        "action_required": "Please verify the node ID"
    }
}
```

### Delete Node

```http
DELETE /nodes/{node_id}?force_delete=true

Success Response (200):
{
    "success": true,
    "deleted_node_id": 1
}

Error Response (400):
{
    "detail": {
        "error": "Node has children",
        "message": "Cannot delete node with children without force_delete=true",
        "action_required": "Set force_delete=true to delete node and its subgraph"
    }
}
```

## Graph Overview

### Get Full Graph

```http
GET /graph/overview

Success Response (200):
{
    "nodes": [
        {
            "id": 1,
            "title": "PCR Optimization",
            "status": "planned",
            "type": "experiment",
            "description": "Optimizing PCR conditions..."
        }
    ],
    "edges": [
        {
            "id": 1,
            "from": 1,
            "to": 2,
            "type": "leads_to",
            "label": "PCR products for sequencing"
        }
    ]
}
```

## Context Keywords

### Add Keyword

```http
POST /context-keywords?keyword=PCR optimization

Success Response (200):
{
    "success": true
}

Error Response (400):
{
    "detail": {
        "error": "Duplicate keyword",
        "message": "This keyword already exists",
        "action_required": "Use a different keyword or update existing one"
    }
}
```

### Get All Keywords

```http
GET /context-keywords

Response:
[
    "PCR optimization",
    "DNA sequencing"
]
```

### Delete Keyword

```http
DELETE /context-keywords/{keyword}

Success Response (200):
{
    "success": true
}

Error Response (404):
{
    "detail": {
        "error": "Keyword not found",
        "message": "The specified keyword does not exist",
        "action_required": "Verify the keyword exists before deletion"
    }
}
```

## Literature References

### Add Literature to Node

```http
POST /nodes/{node_id}/literature?link=https://doi.org/10.1000/pcr123

Success Response (200):
{
    "success": true
}

Error Response (404):
{
    "detail": {
        "error": "Node not found",
        "message": "No node exists with ID {node_id}",
        "action_required": "Please verify the node ID"
    }
}
```

### Get Node's Literature

```http
GET /nodes/{node_id}/literature

Success Response (200):
[
    "https://doi.org/10.1000/pcr123"
]
```

### Delete Literature from Node

```http
DELETE /nodes/{node_id}/literature/{encoded_link}

Success Response (200):
{
    "success": true
}
```

## Response Status Codes

- 200: Success
- 400: Bad Request (e.g., invalid input, constraint violation)
- 404: Not Found (resource doesn't exist)
- 422: Validation Error (missing/invalid fields)
- 500: Server Error (unexpected issues)

## Error Handling Best Practices

1. **Always check error responses** for the `action_required` field which provides guidance on how to fix the error.

2. **Common error scenarios**:

   - Missing required fields
   - Invalid data formats
   - Resource not found
   - Constraint violations (e.g., unique fields)
   - Parent/child relationship conflicts

3. **Retry strategy**:
   - For 5xx errors: Retry with exponential backoff
   - For 4xx errors: Fix the request based on `action_required` before retrying

## Interactive Documentation

Full API documentation with interactive testing is available at:

```
http://127.0.0.1:8000/docs
```
