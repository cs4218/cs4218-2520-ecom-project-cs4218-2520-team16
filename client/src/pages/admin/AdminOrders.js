// Written by Roger Yao with help from copilot.

import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import AdminMenu from "../../components/AdminMenu";
import Layout from "../../components/Layout";
import { useAuth } from "../../context/auth";
import moment from "moment";
import { Select } from "antd";
const { Option } = Select;

const AdminOrders = () => {
  const [status, setStatus] = useState([
    "Not Process",
    "Processing",
    "Shipped",
    "deliverd",
    "cancel",
  ]);
  const [changeStatus, setCHangeStatus] = useState("");
  const [orders, setOrders] = useState([]);
  const [auth, setAuth] = useAuth();
  const getOrders = async () => {
    try {
      const { data } = await axios.get("/api/v1/auth/all-orders");
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      setOrders([]);
      console.log(error);
    }
  };

  useEffect(() => {
    if (auth?.token) getOrders();
  }, [auth?.token]);

  const handleChange = async (orderId, value) => {
    try {
      await axios.put(`/api/v1/auth/order-status/${orderId}`, {
        status: value,
      });
      getOrders();
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <Layout title={"All Orders Data"}>
      <div className="row dashboard">
        <div className="col-md-3">
          <AdminMenu />
        </div>
        <div className="col-md-9">
          <h1 className="text-center">All Orders</h1>
          {Array.isArray(orders) && orders.length > 0 ? (
            orders.map((o, i) => {
              const products = Array.isArray(o?.products) ? o.products : [];
              return (
                <div className="border shadow" key={o && o._id ? o._id : i}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th scope="col">#</th>
                        <th scope="col">Status</th>
                        <th scope="col">Buyer</th>
                        <th scope="col">date</th>
                        <th scope="col">Payment</th>
                        <th scope="col">Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>{i + 1}</td>
                        <td>
                          <Select
                            bordered={false}
                            onChange={(value) => handleChange(o && o._id, value)}
                            defaultValue={o && o.status ? o.status : status[0]}
                            data-testid="status-select"
                          >
                            {Array.isArray(status)
                              ? status.map((s, idx) => (
                                  <Option key={idx} value={s}>
                                    {s}
                                  </Option>
                                ))
                              : null}
                          </Select>
                        </td>
                        <td>{o && o.buyer && o.buyer.name ? o.buyer.name : ""}</td>
                        <td>{o && o.createAt ? moment(o.createAt).fromNow() : ""}</td>
                        <td>{o && o.payment && o.payment.success ? "Success" : "Failed"}</td>
                        <td>{products.length}</td>
                      </tr>
                    </tbody>
                  </table>
                  <div className="container">
                    {products.length > 0
                      ? products.map((p, idx) => (
                          <div className="row mb-2 p-3 card flex-row" key={p && p._id ? p._id : idx}>
                            <div className="col-md-4">
                              <img
                                src={`/api/v1/product/product-photo/${p && p._id}`}
                                className="card-img-top"
                                alt={p && p.name ? p.name : ""}
                                width="100px"
                                height={"100px"}
                              />
                            </div>
                            <div className="col-md-8">
                              <p>{p && p.name ? p.name : ""}</p>
                              <p>{p && p.description ? p.description.substring(0, 30) : ""}</p>
                              <p>Price : {p && p.price ? p.price : 0}</p>
                            </div>
                          </div>
                        ))
                      : null}
                  </div>
                </div>
              );
            })
          ) : null}
        </div>
      </div>
    </Layout>
  );
};

export default AdminOrders;