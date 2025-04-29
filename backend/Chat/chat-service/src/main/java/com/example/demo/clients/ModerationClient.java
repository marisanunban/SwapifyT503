package com.example.demo.clients;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.Map;

    @FeignClient(name = "moderation-client", url = "http://localhost:8087")
    public interface ModerationClient {

        @PostMapping("/moderation/check")
        Boolean isContentAppropriate(@RequestBody Map<String, String> request);
    }

