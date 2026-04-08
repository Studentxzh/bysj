-- 在 campus_textbook_recycle 库中执行，查看外键真实名称（迁移脚本里 DROP FOREIGN KEY 要用这些名字）
SELECT tc.TABLE_NAME, tc.CONSTRAINT_NAME
FROM information_schema.TABLE_CONSTRAINTS tc
WHERE tc.TABLE_SCHEMA = DATABASE()
  AND tc.CONSTRAINT_TYPE = 'FOREIGN KEY'
  AND tc.TABLE_NAME IN ('textbook', 'message', 'transaction_record')
ORDER BY tc.TABLE_NAME, tc.CONSTRAINT_NAME;
