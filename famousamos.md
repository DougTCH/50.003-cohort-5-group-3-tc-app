
### `/routes/auth.js`
- **Classes/Modules**: `User`, `createUser`, `loginUser`
- **Functions**:
  - `router.post('/register')`
  - `router.post('/login')`
  - `router.post('/b2b/getauth')`

### `/routes/b2b.js`
- **Classes/Modules**: `B2BUser`, `createB2BUser`, `loginB2BUser`, `verifyUserExistence`
- **Functions**:
  - `router.post('/register')`
  - `router.post('/login')`
  - `router.post('/exist')`

### `/routes/transact.js`
- **Classes/Modules**: `TransactionRecord`, `AuthMiddleware`
- **Functions**:
  - `router.get('/records/:app_id')`
  - `router.get('/records/status/:status')`
  - `router.get('/obtain_records/status/:status/:last')`
  - `router.get('/record/:t_id')`
  - `router.post('/add_record')`
  - `router.delete('/remove_record/:reference_number')`

With this information, I'll generate a UML class diagram illustrating the structure and relationships within this Node.js API project.

It looks like there was an issue with the attempt to generate the UML diagram using a non-existent module. I will now generate the UML class diagram using a different approach.

I'll manually create a representation of the UML class diagram based on the relationships and methods extracted from the files. Let's do this by creating a visual representation.

### AuthController
- **Attributes**: None
- **Methods**:
  - `register(username, app_code, password)`
  - `login(username, password, app_code)`
  - `getAuth(username, password, app_code)`

### User
- **Attributes**:
  - `username`
  - `app_code`
  - `password`
- **Methods**: None

### B2BController
- **Attributes**: None
- **Methods**:
  - `register(username, app_code, password)`
  - `login(username, password, app_code)`
  - `exist(username, app_code)`

### B2BUser
- **Attributes**:
  - `username`
  - `app_code`
  - `password`
- **Methods**: None

### TransactionController
- **Attributes**: None
- **Methods**:
  - `getRecords(app_id)`
  - `getRecordsByStatus(status)`
  - `getLastRecordsByStatus(status, last)`
  - `getRecordById(t_id)`
  - `addTransaction(transactionData)`
  - `removeTransaction(reference_number)`

### TransactionRecord
- **Attributes**:
  - `app_id`
  - `loyalty_pid`
  - `user_id`
  - `member_id`
  - `member_name`
  - `transaction_date`
  - `reference_number`
  - `amount`
  - `additional_info`
- **Methods**: None

### AuthMiddleware
- **Attributes**: None
- **Methods**:
  - `verifyToken()`

### Relationships:
- `AuthController` uses `User`
- `B2BController` uses `B2BUser`
- `TransactionController` uses `TransactionRecord`
- `TransactionController` uses `AuthMiddleware`
