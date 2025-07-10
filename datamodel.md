## Data Model: AI-Powered Rewarded To-Do List

A comprehensive relational schema designed to support task management, personalized rewards, and AI-driven insights.

### Entity: User

| Field                   | Type         | Constraints      | Description                         |
| ----------------------- | ------------ | ---------------- | ----------------------------------- |
| id                      | UUID         | PK               | Unique user identifier              |
| name                    | VARCHAR(100) | NOT NULL         | Full name                           |
| email                   | VARCHAR(255) | NOT NULL, UNIQUE | Login and contact email             |
| password\_hash          | VARCHAR(512) | NOT NULL         | Hashed user password                |
| preferences             | JSONB        |                  | UI settings and reward preferences  |
| calendar\_sync\_enabled | BOOLEAN      | DEFAULT FALSE    | Flag to sync with external calendar |
| created\_at             | TIMESTAMP    | DEFAULT now()    | Creation timestamp                  |
| updated\_at             | TIMESTAMP    | DEFAULT now()    | Last update timestamp               |

### Entity: Task

| Field           | Type         | Constraints                                                        | Description                                |
| --------------- | ------------ | ------------------------------------------------------------------ | ------------------------------------------ |
| id              | UUID         | PK                                                                 | Unique task identifier                     |
| user\_id        | UUID         | FK → User(id) ON DELETE CASCADE                                    | Owner of the task                          |
| title           | VARCHAR(200) | NOT NULL                                                           | Brief task summary                         |
| description     | TEXT         |                                                                    | Detailed task notes                        |
| due\_date       | TIMESTAMP    |                                                                    | Deadline for completion                    |
| scheduled\_time | TIMESTAMP    |                                                                    | AI-suggested optimal start/completion time |
| priority        | VARCHAR(10)  | CHECK(priority IN ('low','medium','high'))                         | Urgency level                              |
| status          | VARCHAR(12)  | CHECK(status IN ('pending','in\_progress','completed','canceled')) | Current task state                         |
| created\_at     | TIMESTAMP    | DEFAULT now()                                                      | Creation timestamp                         |
| updated\_at     | TIMESTAMP    | DEFAULT now()                                                      | Last update timestamp                      |

### Entity: Reward

| Field       | Type         | Constraints                            | Description                          |
| ----------- | ------------ | -------------------------------------- | ------------------------------------ |
| id          | UUID         | PK                                     | Unique reward identifier             |
| task\_id    | UUID         | FK → Task(id) ON DELETE CASCADE        | Associated task                      |
| type        | VARCHAR(10)  | CHECK(type IN ('text','image','link')) | Reward content format                |
| description | VARCHAR(255) | NOT NULL                               | Reward description or label          |
| image\_url  | VARCHAR(512) |                                        | Optional reward image                |
| link\_url   | VARCHAR(512) |                                        | Optional external link (coupon, etc) |
| cost        | INTEGER      | DEFAULT 0                              | Budget cost units                    |
| created\_at | TIMESTAMP    | DEFAULT now()                          | Creation timestamp                   |
| updated\_at | TIMESTAMP    | DEFAULT now()                          | Last update timestamp                |

### Entity: TaskHistory

| Field                | Type      | Constraints   | Description                    |
| -------------------- | --------- | ------------- | ------------------------------ |
| id                   | UUID      | PK            | Unique history record          |
| user\_id             | UUID      | FK → User(id) | User who completed the task    |
| task\_id             | UUID      | FK → Task(id) | Completed task                 |
| completed\_at        | TIMESTAMP | NOT NULL      | Timestamp of completion        |
| reward\_redeemed     | BOOLEAN   | DEFAULT FALSE | Whether the reward was claimed |
| reward\_redeemed\_at | TIMESTAMP | NULLABLE      | Timestamp of reward redemption |

### Entity: RewardBudget

| Field         | Type    | Constraints   | Description            |
| ------------- | ------- | ------------- | ---------------------- |
| id            | UUID    | PK            | Unique budget record   |
| user\_id      | UUID    | FK → User(id) | Owner of the budget    |
| total\_budget | INTEGER | DEFAULT 0     | Allocated budget units |
| spent\_budget | INTEGER | DEFAULT 0     | Units spent so far     |
| period\_start | DATE    |               | Budget period start    |
| period\_end   | DATE    |               | Budget period end      |

### Entity: Streak

| Field                  | Type    | Constraints   | Description                         |
| ---------------------- | ------- | ------------- | ----------------------------------- |
| id                     | UUID    | PK            | Unique streak record                |
| user\_id               | UUID    | FK → User(id) | Owner of the streak                 |
| current\_streak        | INTEGER | DEFAULT 0     | Consecutive days/tasks completed    |
| longest\_streak        | INTEGER | DEFAULT 0     | Highest streak achieved             |
| last\_completion\_date | DATE    | NULLABLE      | Date of most recent task completion |

### Entity: AIModelMetadata

| Field       | Type         | Constraints   | Description                       |
| ----------- | ------------ | ------------- | --------------------------------- |
| model\_id   | UUID         | PK            | Unique model identifier           |
| name        | VARCHAR(100) | NOT NULL      | Model name                        |
| version     | VARCHAR(50)  | NOT NULL      | Version string                    |
| description | TEXT         |               | Notes on training data or purpose |
| created\_at | TIMESTAMP    | DEFAULT now() | Registration timestamp            |
| updated\_at | TIMESTAMP    | DEFAULT now() | Last metadata update              |

### Relationships & Indexes

* **One-to-Many:**

  * User → Task
  * Task → Reward
  * User → TaskHistory
* **One-to-One:**

  * User → RewardBudget
  * User → Streak
* **Indexes & Constraints:**

  * UNIQUE(email) on **User**
  * Foreign keys with ON DELETE CASCADE
  * CHECK constraints for enum fields
