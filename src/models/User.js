import { Schema, model } from "mongoose";
import bcrypt from "bcryptjs";

const ROLE_VALUES = ["Admin", "Student", "Teacher"];
const SALT_ROUNDS = 10;

const userSchema = new Schema(
	{
		fullName: {
			type: String,
			required: true,
			trim: true,
			minlength: 2,
			maxlength: 100
		},
		email: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true
		},
		username: {
			type: String,
			unique: true,
			sparse: true,
			trim: true
		},
		password: {
			type: String,
			required: true,
			minlength: 6,
			select: false
		},
		role: {
			type: String,
			enum: ROLE_VALUES,
			default: "Student"
		},
		isPaid: {
			type: Boolean,
			default: false
		}
	},
	{
		timestamps: true,
		toJSON: {
			transform: (_doc, ret) => {
				ret.id = ret._id;
				delete ret._id;
				delete ret.__v;
				delete ret.password;
				return ret;
			}
		}
	}
);

userSchema.pre("save", async function () {
	if (!this.isModified("password")) return;

	const salt = await bcrypt.genSalt(SALT_ROUNDS);
	this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
	return bcrypt.compare(candidatePassword, this.password);
};

export default model("User", userSchema);
