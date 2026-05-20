import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface User {
  name: string;
  email: string;
  role: 'Admin' | 'Editor' | 'Viewer';
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly initialUsers: User[] = [
    { name: 'Aditya Kumar', email: 'aditya@example.com', role: 'Admin' },
    { name: 'Neha Sharma', email: 'neha.sharma@example.com', role: 'Editor' },
    { name: 'Rajesh Patel', email: 'rajesh.patel@example.com', role: 'Viewer' },
    { name: 'Pooja Verma', email: 'pooja.v@example.com', role: 'Editor' },
    { name: 'Amit Singh', email: 'amit.singh@example.com', role: 'Viewer' },
  ];

  private readonly usersSubject = new BehaviorSubject<User[]>(this.initialUsers);
  public readonly users$: Observable<User[]> = this.usersSubject.asObservable();

  addUser(user: User): void {
    const currentUsers = this.usersSubject.getValue();
    this.usersSubject.next([...currentUsers, user]);
  }
}
