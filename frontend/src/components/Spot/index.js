import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { spots, reservations, comments } from "../../store/spots";
import LoginFormModal from "../LoginFormModal";
import "./Spot.css";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import CommentForm from "../CommentForm";
import CommentSection from "../CommentSection";
import ReservationCalendar from "../ReservationCalendar";

const Spot = () => {
  const { spotId } = useParams();
  const dispatch = useDispatch();
  const [isLoaded, setIsLoaded] = useState(false);
  const [calendar, setCalendar] = useState(new Date());
  const [loginModal, setLoginModal] = useState(false);
  const [errors, setErrors] = useState([]);
  const sessionSpot = useSelector((state) => state.spots.spot);
  const sessionUser = useSelector((state) => state.session.user);
  const bookings = [];

  const createBookings = (start, end) => {
    bookings.push(new Date(start));
    if (
      start.getFullYear() === end.getFullYear() &&
      start.getMonth() === end.getMonth() &&
      start.getDate() === end.getDate()
    )
      return;
    start.setDate(start.getDate() + 1);
    createBookings(new Date(start), end);
  };
  if (isLoaded) {
    sessionSpot.Bookings.forEach((booking) => {
      createBookings(new Date(booking.startDate), new Date(booking.endDate));
    });
  }

  useEffect(() => {
    dispatch(spots({ spotId }))
      .then(() => dispatch(comments(spotId)))
      .then(() => setIsLoaded(true))
      .then(() => console.log(bookings));
    return function cleanup() {};
  }, []);

  const disableTiles = ({ date, view }) => {
    return (
      view === "month" && // Block day tiles only
      bookings.some(
        (disabledDate) =>
          date.getFullYear() === disabledDate.getFullYear() &&
          date.getMonth() === disabledDate.getMonth() &&
          date.getDate() === disabledDate.getDate()
      )
    );
  };

  const handleReservation = (e) => {
    e.preventDefault();
    if (!sessionUser) {
      setLoginModal(true);
      return;
    }
    const price = Math.round(
      (calendar[1].getTime() - calendar[0].getTime()) / (1000 * 3600 * 24)
    );
    setErrors([]);
    if (sessionUser.id) {
      return dispatch(
        reservations({
          spotId: sessionSpot.Home.spotId,
          userId: sessionUser.id,
          price,
          body: "I'd like to rent your space!",
          startDate: calendar[0],
          endDate: calendar[1],
        })
      ).catch(async (res) => {
        const data = await res.json();

        if (data && data.errors) setErrors(data.errors);
      });
    }
  };

  return (
    isLoaded && (
      <div className="spot-container">
        <div>
          <h2 className="title">{sessionSpot.body}</h2>
        </div>
        <div className="images-container">
          <div id={"first"} key={0}>
            <img src={sessionSpot.Images[0].imageUrl} />
          </div>
          <div className="other-images">
            {sessionSpot.Images.map((image, idx) => {
              if (idx === 0) {
                return;
              }
              return (
                <div className="house-image" id={idx} key={idx}>
                  <img src={image.imageUrl} />
                </div>
              );
            })}
          </div>
        </div>
        <div className="house-info">
          <div className="hosted-by">
            <div className="host-details">
              <div style={{ fontSize: "25px" }}>
                Entire {sessionSpot.Home.type} hosted by{" "}
                {sessionSpot.User.firstName}
              </div>
              <div>
                <div>
                  {sessionSpot.Home.guest} guests {sessionSpot.Home.bed} bed{" "}
                  {sessionSpot.Home.bath} bath
                </div>
              </div>
            </div>
            <div className="profile-pic ">
              <img
                src={sessionSpot.User.profilePic}
                style={{ height: "60px", width: "60px", borderRadius: "50%" }}
              />
            </div>
            <div className="body-text">{sessionSpot.description}</div>
          </div>
          <div>
            <ReservationCalendar spot={sessionSpot} price={sessionSpot.price} />
          </div>
        </div>
        <CommentForm spotId={spotId} />
        <CommentSection spotId={spotId} />
      </div>
    )
  );
};

export default Spot;
