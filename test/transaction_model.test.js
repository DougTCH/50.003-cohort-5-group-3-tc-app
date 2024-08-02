const { TransactionRecord } =require("../models/transactions");

describe("Transaction Records Unit Tests", ()=>{
    it("Check Record Validity Valid Case",()=>{
        const tr = new TransactionRecord({
            "app_id":"NATIONAL_BANKING",
            "loyalty_pid":"JOYSPRING_TOYS",
            "user_id":"01238771jb2v1723",
            "member_id":"0987152222R",
            "member_first":"John",
            "member_last":"Does",
            "transaction_date":"20240808",
            "ref_num":"000000001",
            "amount":1000000,
            "status":"pending",
            "additional_info":"Hello Hello additional info"
        });
        expect(TransactionRecord.checkValidity(tr,(errmsg)=>expect(errmsg!=null).toBe(false))).toBe(true);
    });
    it("Check Record Validity Invalid Date",()=>{
        const tr = new TransactionRecord({
            "app_id":"NATIONAL_BANKING",
            "loyalty_pid":"JOYSPRING_TOYS",
            "user_id":"01238771jb2v1723",
            "member_id":"0987152222R",
            "member_first":"John",
            "member_last":"Does",
            "transaction_date":"20243108",
            "ref_num":"000000001",
            "amount":1000000,
            "status":"pending",
            "additional_info":"Hello Hello additional info"
        });
        expect(TransactionRecord.checkValidity(tr,(errmsg)=>expect(errmsg==null).toBe(false))).toBe(false);
    });
    it("Check Record Validity Invalid Amount",()=>{
        const tr = new TransactionRecord({
            "app_id":"NATIONAL_BANKING",
            "loyalty_pid":"JOYSPRING_TOYS",
            "user_id":"01238771jb2v1723",
            "member_id":"0987152222R",
            "member_first":"John",
            "member_last":"Does",
            "transaction_date":"20243108",
            "ref_num":"000000001",
            "amount":-1000000,
            "status":"pending",
            "additional_info":"Hello Hello additional info"
        });
        expect(TransactionRecord.checkValidity(tr,(errmsg)=>expect(errmsg==null).toBe(false))).toBe(false);
    });
    it("Check Record Validity Missing Reference No.",()=>{
        const tr = new TransactionRecord({
            "app_id":"NATIONAL_BANKING",
            "loyalty_pid":"JOYSPRING_TOYS",
            "user_id":"01238771jb2v1723",
            "member_id":"0987152222R",
            "member_first":"John",
            "member_last":"Does",
            "transaction_date":"20243108",
            "amount":-1000000,
            "status":"pending",
            "additional_info":"Hello Hello additional info"
        });
        expect(TransactionRecord.checkValidity(tr,(errmsg)=>expect(errmsg==null).toBe(false))).toBe(false);
    });
    it("Check Record Validity Missing Member info",()=>{
        const tr = new TransactionRecord({
            "app_id":"NATIONAL_BANKING",
            "loyalty_pid":"JOYSPRING_TOYS",
            "user_id":"01238771jb2v1723",
            "transaction_date":"20240808",
            "amount":1000000,
            "status":"pending",
            "additional_info":"Hello Hello additional info"
        });
        expect(TransactionRecord.checkValidity(tr,(errmsg)=>expect(errmsg==null).toBe(true))).toBe(true);
    });
});