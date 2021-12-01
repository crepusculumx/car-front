import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  constructor(private httpClient: HttpClient) {}

  getFeatures(): Observable<any> {
    return this.httpClient.get(`features`);
  }

  getData(id: number): Observable<any> {
    return this.httpClient.get(`data${id}`);
  }
}
