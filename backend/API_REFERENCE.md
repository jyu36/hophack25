# Research Assistant API Reference

## Base URL

```
http://127.0.0.1:8000
```

## Interactive Documentation

Full API documentation with interactive testing is available at:

```
http://127.0.0.1:8000/docs
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

- 400: Bad Request (invalid input data, constraint violations)
- 404: Resource not found
- 422: Validation error (missing/invalid fields)
- 500: Server error

## Experiment Status Values

The API uses the following experiment status values:

- `planned`: Experiment is defined but not started
- `completed`: Experiment has been finished
- `rejected`: Experiment was rejected or cancelled

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
    "status": "planned",                      # Optional, defaults to "planned"
    "hypothesis": "Temperature affects...",    # Optional
    "result": "Found optimal at 60°C...",     # Optional
    "extra_data": {                           # Optional
        "protocol_version": "v2.1",
        "equipment": ["thermocycler", "pipettes"]
    }
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
    "created_at": "2025-01-13T04:57:49",
    "updated_at": "2025-01-13T04:57:49"
}

Error Response (422):
{
    "detail": {
        "error": "Invalid experiment data",
        "validation_errors": {
            "missing_fields": ["title"],
            "invalid_fields": {
                "description": "Description is too brief"
            },
            "suggestions": {
                "title": "Provide a clear, descriptive title for the experiment",
                "description": "Provide a more detailed description (at least 20 characters)"
            }
        },
        "message": "The provided experiment data needs improvement",
        "action_required": "Please address the following issues:",
        "reprompt_guidance": {
            "examples": {
                "title": "PCR Optimization for DNA Amplification",
                "description": "A detailed study to optimize PCR conditions for improved DNA amplification efficiency"
            }
        }
    }
}
```

### Get Node Info

```http
GET /nodes/{node_id}?with_parents=true&with_children=true

Query Parameters:
- `with_parents` (bool, default: true): Include parent nodes in response
- `with_children` (bool, default: true): Include child nodes in response

Success Response (200):
{
    "node": {
        "id": 2,
        "title": "DNA Sequencing",
        "description": "Sequencing amplified DNA samples",
        "motivation": "Need to verify PCR results",
        "expectations": "Get clear DNA sequence data",
        "status": "planned",
        "hypothesis": null,
        "result": null,
        "extra_data": null,
        "created_at": "2025-01-13T04:57:49",
        "updated_at": "2025-01-13T04:57:49"
    },
    "parents": [
        {
            "id": 1,
            "title": "PCR Optimization",
            "description": "Optimizing PCR conditions...",
            "relationship_type": "leads_to",
            "relationship_id": 1
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

### Update Node

```http
PATCH /nodes/{node_id}

Request Body:
{
    "title": "Updated Title",            # Optional
    "description": "Updated desc",       # Optional
    "motivation": "New motivation",      # Optional
    "expectations": "New expectations",  # Optional
    "status": "completed",               # Optional (planned|completed|rejected)
    "hypothesis": "Updated hypothesis",  # Optional
    "result": "Experiment results",      # Optional
    "extra_data": {                      # Optional
        "protocol_version": "v2.2",
        "equipment": ["thermocycler", "pipettes", "gel_electrophoresis"]
    }
}

Success Response (200):
{
    "id": 1,
    "title": "Updated Title",
    "description": "Updated desc",
    "motivation": "New motivation",
    "expectations": "New expectations",
    "status": "completed",
    "hypothesis": "Updated hypothesis",
    "result": "Experiment results",
    "extra_data": {
        "protocol_version": "v2.2",
        "equipment": ["thermocycler", "pipettes", "gel_electrophoresis"]
    },
    "created_at": "2025-01-13T04:57:49",
    "updated_at": "2025-01-13T05:30:15"
}

Error Response (422):
{
    "detail": {
        "error": "Invalid field values",
        "invalid_fields": {
            "status": "Must be one of: planned, completed, rejected"
        },
        "message": "Some fields contain invalid values",
        "action_required": "Please correct the invalid fields. Valid status values are: planned, completed, rejected"
    }
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
            "description": "Optimizing PCR conditions...",
            "created_at": "2025-01-13T04:57:49",
            "updated_at": "2025-01-13T04:57:49"
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

## Edge Management

### Create Edge

```http
POST /edges

Request Body:
{
    "from_experiment_id": 1,
    "to_experiment_id": 2,
    "relationship_type": "leads_to",
    "label": "PCR products for sequencing",
    "extra_data": {
        "confidence": 0.95,
        "notes": "Strong causal relationship"
    }
}

Success Response (200):
{
    "id": 1,
    "from_experiment_id": 1,
    "to_experiment_id": 2,
    "relationship_type": "leads_to",
    "label": "PCR products for sequencing",
    "extra_data": {
        "confidence": 0.95,
        "notes": "Strong causal relationship"
    },
    "created_at": "2025-01-13T04:57:49"
}

Error Response (404):
{
    "detail": {
        "error": "Node(s) not found",
        "message": "The following nodes do not exist: from_experiment_id: 1",
        "action_required": "Please verify both node IDs exist"
    }
}

Error Response (400):
{
    "detail": {
        "error": "Invalid edge",
        "message": "Cannot create an edge from a node to itself",
        "action_required": "Please provide different from_experiment_id and to_experiment_id"
    }
}
```

### Update Edge

```http
PATCH /edges/{edge_id}

Request Body:
{
    "relationship_type": "supports",
    "label": "Updated relationship description",
    "extra_data": {
        "confidence": 0.8,
        "notes": "Updated notes"
    }
}

Success Response (200):
{
    "id": 1,
    "from_experiment_id": 1,
    "to_experiment_id": 2,
    "relationship_type": "supports",
    "label": "Updated relationship description",
    "extra_data": {
        "confidence": 0.8,
        "notes": "Updated notes"
    },
    "created_at": "2025-01-13T04:57:49"
}
```

### Delete Edge

```http
DELETE /edges/{edge_id}

Success Response (200):
{
    "success": true,
    "deleted_edge_id": 1
}

Error Response (404):
{
    "detail": {
        "error": "Edge not found",
        "message": "No edge exists with ID {edge_id}",
        "action_required": "Please verify the edge ID"
    }
}
```

## Relationship Types

The API supports the following relationship types (case-insensitive):

- `leads_to`: This experiment led to the creation of another
- `supports`: Results support another experiment's hypothesis
- `refutes`: Results contradict another experiment's hypothesis
- `requires`: This experiment depends on another's completion
- `related`: General relationship between experiments
- `inspires`: This experiment inspired another
- `extends`: This experiment extends/builds upon another
- `validates`: This experiment validates another's findings
- `implements`: This experiment implements another's theory/method

## Context Keywords

### Add Keyword

```http
POST /context-keywords?keyword=PCR optimization

Query Parameters:
- `keyword` (string, required): The keyword to add

Success Response (200):
{
    "success": true
}

Error Response (400):
{
    "detail": "Keyword already exists"
}
```

### Get All Keywords

```http
GET /context-keywords

Success Response (200):
[
    "PCR optimization",
    "DNA sequencing",
    "machine learning"
]
```

### Delete Keyword

```http
DELETE /context-keywords/{keyword}

Path Parameters:
- `keyword` (string): The keyword to delete

Success Response (200):
{
    "success": true
}

Error Response (404):
{
    "detail": "Keyword not found"
}
```

## Literature References

### Add Literature to Node

```http
POST /nodes/{node_id}/literature?link=https://doi.org/10.1000/pcr123&relationship=similar

Query Parameters:
- `link` (string, required): Paper link (OpenAlex URL or DOI)
- `relationship` (string, optional, default: "similar"): Relationship type

Success Response (200):
{
    "success": true,
    "id": 1,
    "openalex_id": "W2741809807"
}

Error Response (404):
{
    "detail": "Node not found"
}

Error Response (400):
{
    "detail": "Literature reference already exists for this node"
}
```

### Get Node's Literature

```http
GET /nodes/{node_id}/literature

Success Response (200):
[
    {
        "id": "https://openalex.org/W2741809807",
        "title": "PCR Optimization Techniques",
        "year": 2023,
        "venue": "Nature Methods",
        "doi": "10.1038/s41592-023-01800-1",
        "url": "https://doi.org/10.1038/s41592-023-01800-1",
        "relationship": "similar",
        "confidence": 0.95,
        "verified": {},
        "summary": "This paper presents novel PCR optimization methods"
    }
]
```

### Get Suggested Literature

```http
GET /nodes/{node_id}/literature/suggested?ignore_cache=false&relationship=auto

Query Parameters:
- `ignore_cache` (bool, optional, default: false): Bypass cache and recompute suggestion
- `relationship` (string, optional, default: "auto"): Relationship type (auto|similar|builds_on|prior|contrast)

Success Response (200):
{
    "id": "https://openalex.org/W2741809807",
    "title": "Advanced PCR Techniques",
    "year": 2023,
    "venue": "Science",
    "doi": "10.1126/science.abc123",
    "url": "https://doi.org/10.1126/science.abc123",
    "relationship": "builds_on",
    "confidence": 0.87,
    "verified": {
        "methodology": "confirmed",
        "results": "validated"
    },
    "summary": "This study builds upon previous PCR optimization work"
}
```

### Get All Literature

```http
GET /literature

Success Response (200):
[
    {
        "node_id": 1,
        "node_title": "PCR Optimization",
        "link": "https://doi.org/10.1038/s41592-023-01800-1"
    }
]
```

### Delete Literature from Node

```http
DELETE /nodes/{node_id}/literature/{encoded_link}

Path Parameters:
- `node_id` (int): The node ID
- `encoded_link` (string): URL-encoded literature link

Success Response (200):
{
    "success": true
}

Error Response (404):
{
    "detail": "Literature reference not found"
}
```

## Response Status Codes

- 200: Success
- 400: Bad Request (invalid input, constraint violations, duplicate resources)
- 404: Not Found (resource doesn't exist)
- 422: Validation Error (missing/invalid fields, invalid enum values)
- 500: Server Error (unexpected issues)

## Error Handling Best Practices

1. **Always check error responses** for the `action_required` field which provides guidance on how to fix the error.

2. **Common error scenarios**:

   - Missing required fields (title for experiments)
   - Invalid data formats
   - Resource not found (nodes, edges, literature)
   - Constraint violations (duplicate keywords, self-referencing edges)
   - Invalid enum values (status, relationship_type)
   - Parent/child relationship conflicts

3. **Retry strategy**:

   - For 5xx errors: Retry with exponential backoff
   - For 4xx errors: Fix the request based on `action_required` before retrying

4. **Validation errors** provide detailed feedback including:
   - `missing_fields`: List of required fields that are missing
   - `invalid_fields`: Fields with invalid values and explanations
   - `suggestions`: Specific guidance for improving the data
   - `reprompt_guidance`: Examples and best practices for AI agents

## Data Models

### Experiment Fields

- `id`: Auto-generated unique identifier
- `title`: Required, descriptive title (min 5 characters)
- `description`: Optional, detailed description (min 20 characters if provided)
- `motivation`: Optional, reasoning for the experiment (min 20 characters if provided)
- `expectations`: Optional, what you expect to learn
- `status`: Enum (planned|completed|rejected), defaults to "planned"
- `hypothesis`: Optional, the hypothesis being tested
- `result`: Optional, experiment outcomes
- `extra_data`: Optional JSON object for additional metadata
- `created_at`: Auto-generated timestamp
- `updated_at`: Auto-generated timestamp

### Relationship Fields

- `id`: Auto-generated unique identifier
- `from_experiment_id`: Source experiment ID
- `to_experiment_id`: Target experiment ID
- `relationship_type`: Enum (see Relationship Types section)
- `label`: Optional description of the relationship
- `extra_data`: Optional JSON object for additional metadata
- `created_at`: Auto-generated timestamp

## API Features

- **Comprehensive validation**: Detailed error messages with suggestions
- **Flexible data storage**: JSON fields for custom metadata
- **Relationship management**: Full CRUD operations for experiment connections
- **Literature integration**: OpenAlex API integration for paper metadata
- **Caching**: Literature suggestions are cached for performance
- **Logging**: All requests and responses are logged for debugging
