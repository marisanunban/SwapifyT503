package com.example.repositories;

import com.example.entities.Users;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuthRepository extends JpaRepository<Users, Long> {

}
