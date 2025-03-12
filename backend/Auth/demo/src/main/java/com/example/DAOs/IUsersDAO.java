package com.example.DAOs;

import com.example.entities.Users;
import org.springframework.data.repository.CrudRepository;

public interface IUsersDAO extends CrudRepository<Users, Integer> {
}
