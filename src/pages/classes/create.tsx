import {CreateView} from "@/components/refine-ui/views/create-view.tsx";
import {PageHeader} from "@/components/layout/page-header.tsx";
import {SectionHeader} from "@/components/layout/section-header.tsx";
import {Button} from "@/components/ui/button.tsx";
import {useBack, useGetIdentity, useList} from "@refinedev/core";
import {Separator} from "@/components/ui/separator.tsx";
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "@refinedev/react-hook-form"
import type { ControllerRenderProps } from "react-hook-form";
import {classSchema} from "@/lib/schema.ts";
import * as z from "zod";
import { useEffect } from "react";

type ClassFormValues = z.infer<typeof classSchema>;
type UploadedFile = { url: string; publicId: string } | null;

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select.tsx";
import {Textarea} from "@/components/ui/textarea.tsx";
import {Loader2} from "lucide-react";
import UploadWidget from "@/components/upload-widget.tsx";
import {Subject, User, UserRole} from "@/types";
import { useApiQuery } from "@/hooks/use-api-query";

type AcademicYear = { id: number; name: string; startsOn: string; endsOn: string; active: boolean };

const Create = () => {
    const back = useBack();
    const { data: identity } = useGetIdentity<User>();
    const isTeacher = identity?.role === UserRole.TEACHER;
    const isAdmin = identity?.role === UserRole.ADMIN || identity?.role === UserRole.SUPER_ADMIN;
    const { data: yearsData } = useApiQuery<{ data: AcademicYear[] }>(isAdmin ? "/grades/academic-years" : null);
    const academicYears = yearsData?.data ?? [];

    const form = useForm({
        resolver: zodResolver(classSchema),
        refineCoreProps: {
            resource: "classes",
            action: "create",
        }
    });

    const {
        refineCore: { onFinish },
        handleSubmit,
        formState: { isSubmitting, errors },
        control,
        setValue,
    } = form;

    // A teacher can only create classes taught by themselves — the backend
    // forces teacherId to the caller for that role, so the picker is
    // pointless (and would silently be overridden). Set it automatically
    // instead of showing a dropdown of every teacher in the school.
    useEffect(() => {
        if (isTeacher && identity?.id) {
            setValue("teacherId", identity.id, { shouldValidate: true });
        }
    }, [isTeacher, identity?.id, setValue]);

    const onSubmit = async (values: z.infer<typeof classSchema>) => {
        try {
            await onFinish(values);
        } catch (error) {
            console.error("Error creating class:", error);
        }
    };

    const { query: subjectsQuery } = useList<Subject>({
        resource: 'subjects',
        pagination: {
            pageSize: 100
        }
    })

    const { query: teachersQuery } = useList<User>({
        resource: 'users',
        filters: [
            { field: 'role', operator: 'eq', value: 'teacher' },
        ],
        pagination: {
            pageSize: 100
        },
        queryOptions: {
            enabled: !isTeacher,
        },
    })

    const subjects = subjectsQuery?.data?.data || [];
    const subjectsLoading = subjectsQuery.isLoading;

    const teachers = teachersQuery?.data?.data || [];
    const teachersLoading = teachersQuery.isLoading


    const bannerPublicId = form.watch('bannerCldPubId');

    const setBannerImage = (file: UploadedFile, field: ControllerRenderProps<ClassFormValues, "bannerUrl">) => {
        if(file) {
            field.onChange(file.url);
            form.setValue('bannerCldPubId', file.publicId, {
                shouldValidate: true,
                shouldDirty: true,
            })
        } else {
            field.onChange('');
            form.setValue('bannerCldPubId', '', {
                shouldValidate: true,
                shouldDirty: true,
            })
        }
    }

    return (
        <CreateView className="class-view">
            <PageHeader
                breadcrumb
                title="Create class"
                description="Set up the class context, teaching responsibility and capacity."
                actions={<Button variant="outline" onClick={() => back()}>Cancel</Button>}
            />
            <section className="max-w-4xl overflow-hidden rounded-lg border bg-background">
                <div className="p-5 sm:p-6">
                    <SectionHeader title="Class details" description="Fields marked as required must be completed before the class can be created." />
                    <div className="mt-5">
                        <Form {...form}>
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                                <FormField
                                    control={control}
                                    name="bannerUrl"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Banner Image <span className="text-orange-600">*</span></FormLabel>
                                            <FormControl>
                                                <UploadWidget
                                                    value={field.value ? { url:  field.value, publicId: bannerPublicId ?? ''} : null}
                                                    onChange={(file) => setBannerImage(file, field)}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                            {errors.bannerCldPubId && !errors.bannerUrl && (
                                                <p className="text-destructive text-sm">{errors.bannerCldPubId.message?.toString()}</p>
                                            )}
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Class Name <span className="text-orange-600">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Introduction to Biology - Section A"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid sm:grid-cols-2 gap-4">
                                    <FormField
                                        control={control}
                                        name="subjectId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Subject <span className="text-orange-600">*</span>
                                                </FormLabel>
                                                <Select
                                                    onValueChange={(value) =>
                                                        field.onChange(Number(value))
                                                    }
                                                    value={field.value?.toString()}
                                                    disabled={subjectsLoading}

                                                >
                                                    <FormControl>
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Select a subject" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {subjects.map((subject) => (
                                                            <SelectItem
                                                                key={subject.id}
                                                                value={subject.id.toString()}
                                                            >
                                                                {subject.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={control}
                                        name="teacherId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Teacher <span className="text-orange-600">*</span>
                                                </FormLabel>
                                                {isTeacher ? (
                                                    <FormControl>
                                                        <Input value={identity?.name ?? "You"} disabled readOnly />
                                                    </FormControl>
                                                ) : (
                                                    <Select
                                                        onValueChange={field.onChange}
                                                        value={field.value}
                                                        disabled={teachersLoading}

                                                    >
                                                        <FormControl>
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue placeholder="Select a teacher" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {teachers.map((teacher) => (
                                                                <SelectItem
                                                                    key={teacher.id}
                                                                    value={teacher.id.toString()}
                                                                >
                                                                    {teacher.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid sm:grid-cols-2 gap-4">
                                    <FormField
                                        control={control}
                                        name="capacity"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Capacity</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        placeholder="30"
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            field.onChange(value ? Number(value) : undefined);
                                                        }}
                                                        value={(field.value as number | undefined) ?? ""}
                                                        name={field.name}
                                                        ref={field.ref}
                                                        onBlur={field.onBlur}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={control}
                                        name="status"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Status <span className="text-orange-600">*</span>
                                                </FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    value={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Select status" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="active">Active</SelectItem>
                                                        <SelectItem value="inactive">Inactive</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    {isAdmin && <FormField
                                        control={control}
                                        name="schoolLevel"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>School level <span className="text-orange-600">*</span></FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                                                    <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Classify for formal results" /></SelectTrigger></FormControl>
                                                    <SelectContent><SelectItem value="nursery">Nursery / Kindergarten</SelectItem><SelectItem value="primary">Primary</SelectItem><SelectItem value="secondary">Secondary</SelectItem></SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />}
                                    {isAdmin && <FormField control={control} name="academicYearId" render={({ field }) => <FormItem><FormLabel>Academic year</FormLabel><Select onValueChange={(value) => field.onChange(Number(value))} value={field.value ? String(field.value) : undefined}><FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Use active academic year" /></SelectTrigger></FormControl><SelectContent>{academicYears.map((year) => <SelectItem key={year.id} value={String(year.id)}>{year.name}{year.active ? " (active)" : ""}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />}
                                </div>

                                <FormField
                                    control={control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Description</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Brief description about the class"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Separator />
                                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                    <Button type="button" variant="outline" onClick={() => back()} disabled={isSubmitting}>Cancel</Button>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {isSubmitting ? "Creating class..." : "Create class"}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </div>
                </div>
            </section>
        </CreateView>
    );
};

export default Create;
