import mongoose, { Schema, Document, Model, Types } from 'mongoose'

export interface RideStop {
  name: string
  time: string   // "HH:MM" format
  order: number
}

export interface IRide extends Document {
  driverId: Types.ObjectId
  date: Date           // stored as UTC midnight of the ride date
  departureTime: string  // "HH:MM" IST
  direction: 'to_office' | 'from_office'
  stops: RideStop[]
  totalSeats: number
  bookedSeats: number
  fare: number
  status: 'open' | 'full' | 'cancelled' | 'completed'
  createdAt: Date
  updatedAt: Date
}

const StopSchema = new Schema<RideStop>(
  {
    name: { type: String, required: true, trim: true },
    time: { type: String, required: true },
    order: { type: Number, required: true },
  },
  { _id: false }
)

const RideSchema = new Schema<IRide>(
  {
    driverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    departureTime: { type: String, required: true },
    direction: { type: String, enum: ['to_office', 'from_office'], required: true },
    stops: { type: [StopSchema], required: true, validate: [(v: RideStop[]) => v.length >= 2, 'At least 2 stops required'] },
    totalSeats: { type: Number, required: true, min: 1, max: 6 },
    bookedSeats: { type: Number, default: 0 },
    fare: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['open', 'full', 'cancelled', 'completed'], default: 'open' },
  },
  { timestamps: true }
)

// Auto-update status to 'full' when bookedSeats == totalSeats
RideSchema.pre('save', function () {
  if (this.bookedSeats >= this.totalSeats) {
    this.status = 'full'
  } else if (this.status === 'full' && this.bookedSeats < this.totalSeats) {
    this.status = 'open'
  }
})

const Ride: Model<IRide> =
  mongoose.models.Ride ?? mongoose.model<IRide>('Ride', RideSchema)

export default Ride
