package com.ncu.textbook.util;

/**
 * 管理员主键自增起始值与 {@link com.ncu.textbook.mapper.AdminMapper} 所在表
 * {@code sys_admin} 的 AUTO_INCREMENT 一致，用于区分学生与管理员账号（学生 ID 小于该值）。
 */
public final class AccountIds {

    public static final long ADMIN_MIN_ID = 10_000_000L;

    private AccountIds() {
    }

    public static boolean isAdminId(Long id) {
        return id != null && id >= ADMIN_MIN_ID;
    }
}
