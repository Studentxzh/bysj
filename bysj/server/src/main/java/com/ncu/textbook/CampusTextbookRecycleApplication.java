package com.ncu.textbook;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.ncu.textbook.mapper")
public class CampusTextbookRecycleApplication {

    public static void main(String[] args) {
        SpringApplication.run(CampusTextbookRecycleApplication.class, args);
    }
}

