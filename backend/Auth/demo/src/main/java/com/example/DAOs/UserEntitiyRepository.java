package com.example.DAOs;

import com.example.entities.Users;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserEntitiyRepository extends CrudRepository<Users, Long> {
}
