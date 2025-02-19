import React, { useState, useEffect } from "react";

const NotificationsSidebar = ({ notifications, clearNotifications, removeNotification }) => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (notifications.length > 0) {
            setIsOpen(true);
        } else {
            setIsOpen(false); // Auto-close sidebar when no notifications
        }
    }, [notifications]);
    

    return (
        <div style={{ 
            position: "fixed", 
            top: 0, 
            right: isOpen ? 0 : "-320px", 
            width: "300px", 
            height: "100vh", 
            backgroundColor: "#f8f9fa", 
            boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
            padding: "20px",
            overflowY: "auto",
            transition: "right 0.4s ease-in-out, box-shadow 0.2s ease-in-out",
            zIndex: 1000
        }}>
            {/* Sidebar Toggle Button */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: "absolute",
                    left: "-50px",
                    top: "20px",
                    background: "#007bff",
                    color: "white",
                    border: "none",
                    padding: "10px 15px",
                    fontSize: "16px",
                    cursor: "pointer",
                    borderRadius: "5px",
                    boxShadow: "0px 2px 5px rgba(0,0,0,0.3)"
                }}
            >
                {isOpen ? "❌" : "🔔"}
            </button>

            <h3 style={{ marginBottom: "10px", fontWeight: "bold" }}>Notifications</h3>

            {/* Clear All Button */}
            {notifications.length > 0 && (
                <button 
                    onClick={clearNotifications}
                    style={{
                        background: "#dc3545",
                        color: "white",
                        border: "none",
                        padding: "8px",
                        borderRadius: "5px",
                        cursor: "pointer",
                        width: "100%",
                        marginBottom: "10px"
                    }}
                >
                    Clear All
                </button>
            )}

            {/* Notification List */}
            {notifications.length === 0 ? (
                <p style={{ color: "#777" }}>No notifications</p>
            ) : (
                notifications.map((notif, index) => (
                    <div key={notif.id ? `notif-${notif.id}` : `notif-${index}`} style={{ 
                        backgroundColor: "#fff", 
                        padding: "10px", 
                        margin: "5px 0",
                        borderRadius: "5px",
                        boxShadow: "0px 1px 5px rgba(0,0,0,0.1)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                    }}>
                        <span>{notif.text}</span>
                        <button 
                            onClick={() => removeNotification(notif.id)}
                            style={{
                                background: "transparent",
                                border: "none",
                                color: "#dc3545",
                                cursor: "pointer",
                                fontSize: "16px"
                            }}
                        >
                            ❌
                        </button>
                    </div>
                ))
            )}
        </div>
    );
};

export default NotificationsSidebar;
